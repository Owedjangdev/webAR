"""Service analytics : enregistrement des événements et agrégation des stats.

- record_event : enregistre un scan/capture pour une expérience PUBLIÉE (sinon 404).
- partner_stats : agrège les compteurs des expériences d'un partenaire (totaux,
  détail par expérience, série quotidienne) pour GET /api/partner/stats.

Toute la lecture passe par SQLAlchemy (pas de SQL brut), filtrée par owner_id pour
ne jamais exposer les chiffres d'un autre partenaire (scénario A3).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from models import (
    EventType,
    Experience,
    ExperienceEvent,
    ExperienceStatus,
    Place,
)
from schemas.stats import DailyPoint, ExperienceStat, PartnerStatsOut

# Fenêtre par défaut de la série quotidienne (graphiques du tableau de bord).
DEFAULT_DAYS = 30

# Sommes conditionnelles réutilisées (1 par scan / par capture, 0 sinon).
_SCANS = func.coalesce(func.sum(case((ExperienceEvent.type == EventType.scan, 1), else_=0)), 0)
_CAPTURES = func.coalesce(func.sum(case((ExperienceEvent.type == EventType.capture, 1), else_=0)), 0)


def record_event(db: Session, public_id: str, event_type: EventType) -> None:
    """Enregistre un événement (scan/capture) pour une expérience publiée.

    404 si l'expérience est inconnue ou non publiée : on ne traque pas (et on ne
    révèle pas) un brouillon. Endpoint public, appelé par le frontend visiteur.
    """
    experience = db.scalar(
        select(Experience).where(Experience.public_id == public_id)
    )
    if experience is None or experience.status != ExperienceStatus.published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cette expérience n'est pas disponible.",
        )
    db.add(ExperienceEvent(experience_id=experience.id, type=event_type))
    db.commit()


def partner_stats(db: Session, partner_id: int, days: int = DEFAULT_DAYS) -> PartnerStatsOut:
    """Agrège les statistiques de toutes les expériences d'un partenaire."""
    by_experience = _stats_by_experience(db, partner_id)
    total_scans = sum(e.scans for e in by_experience)
    total_captures = sum(e.captures for e in by_experience)
    conversion = round(total_captures / total_scans, 4) if total_scans else 0.0

    return PartnerStatsOut(
        total_scans=total_scans,
        total_captures=total_captures,
        conversion_rate=conversion,
        by_experience=by_experience,
        daily=_daily_series(db, partner_id, days),
    )


def _stats_by_experience(db: Session, partner_id: int) -> list[ExperienceStat]:
    """Compteurs scans/captures par expérience des lieux du partenaire.

    LEFT JOIN sur les events : une expérience sans aucun événement remonte à 0/0.
    """
    rows = db.execute(
        select(
            Experience.public_id,
            Experience.template,
            Place.name,
            _SCANS,
            _CAPTURES,
        )
        .select_from(Experience)
        .join(Place, Experience.place_id == Place.id)
        .outerjoin(ExperienceEvent, ExperienceEvent.experience_id == Experience.id)
        .where(Place.owner_id == partner_id)
        .group_by(Experience.id, Experience.public_id, Experience.template, Place.name)
        .order_by(Place.name, Experience.public_id)
    ).all()
    return [
        ExperienceStat(
            experience_id=public_id,
            template=template,
            place_name=place_name,
            scans=int(scans),
            captures=int(captures),
        )
        for public_id, template, place_name, scans, captures in rows
    ]


def _daily_series(db: Session, partner_id: int, days: int) -> list[DailyPoint]:
    """Série jour par jour (scans/captures) sur les `days` derniers jours.

    Les jours sans événement sont comblés à 0 pour un graphique continu.
    """
    start = date.today() - timedelta(days=days - 1)
    day = func.date(ExperienceEvent.created_at)
    rows = db.execute(
        select(day, _SCANS, _CAPTURES)
        .select_from(ExperienceEvent)
        .join(Experience, ExperienceEvent.experience_id == Experience.id)
        .join(Place, Experience.place_id == Place.id)
        .where(
            Place.owner_id == partner_id,
            ExperienceEvent.created_at >= datetime.combine(start, datetime.min.time()),
        )
        .group_by(day)
    ).all()

    # Index {jour ISO -> (scans, captures)} pour combler les trous.
    counts: dict[str, tuple[int, int]] = {}
    for d, scans, captures in rows:
        key = d.isoformat() if isinstance(d, date) else str(d)
        counts[key] = (int(scans), int(captures))

    series: list[DailyPoint] = []
    for offset in range(days):
        d = (start + timedelta(days=offset)).isoformat()
        scans, captures = counts.get(d, (0, 0))
        series.append(DailyPoint(date=d, scans=scans, captures=captures))
    return series
