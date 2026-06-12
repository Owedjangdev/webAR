"""Schémas Pydantic des statistiques partenaire (GET /api/partner/stats).

Forme libre (hors contrat JSON visiteur) : agrégats destinés au tableau de bord
du partenaire (totaux, détail par expérience, série quotidienne pour les graphes).
"""

from pydantic import BaseModel


class ExperienceStat(BaseModel):
    """Compteurs d'une expérience du partenaire."""

    experience_id: str  # public_id (= "experience_id" du contrat)
    template: str
    place_name: str
    scans: int
    captures: int


class DailyPoint(BaseModel):
    """Point d'une série quotidienne (un jour) pour les graphiques."""

    date: str  # AAAA-MM-JJ
    scans: int
    captures: int


class PartnerStatsOut(BaseModel):
    """Statistiques agrégées de tous les lieux/expériences d'un partenaire."""

    total_scans: int
    total_captures: int
    # Taux de conversion captures/scans (0 si aucun scan), arrondi à 0–1.
    conversion_rate: float
    by_experience: list[ExperienceStat]
    daily: list[DailyPoint]  # N derniers jours (ordre chronologique)
