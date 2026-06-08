"""Logique métier de la chasse au trésor (lecture + progression anonyme).

Centralise ici (et nulle part ailleurs) :
- la résolution « expérience publique -> chasse » avec ses règles d'accès (404) ;
- la sérialisation ORM -> schéma de réponse (sans exposer les validation_code) ;
- la validation d'étape avec anti-triche (ordre imposé), pour garder le router mince.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import AnonymousSession, Experience, ExperienceStatus, Hunt
from schemas.hunt import HuntDetail, HuntStepOut, StepValidationResponse

# Une chasse n'existe que pour une expérience de ce template.
_TREASURE_HUNT_TEMPLATE = "treasure_hunt"


def get_published_hunt(db: Session, experience_public_id: str) -> Hunt:
    """Retourne la chasse d'une expérience publiée `treasure_hunt`, sinon 404.

    404 (et pas 403/200 vide) couvre tous les cas « pas de chasse jouable » sans
    révéler la cause exacte : expérience inexistante, en brouillon, mauvais
    template, ou sans chasse rattachée.
    """
    experience = db.scalar(
        select(Experience).where(Experience.public_id == experience_public_id)
    )
    if (
        experience is None
        or experience.status != ExperienceStatus.published
        or experience.template != _TREASURE_HUNT_TEMPLATE
        or experience.hunt is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune chasse au trésor disponible pour cette expérience.",
        )
    return experience.hunt


def to_detail(hunt: Hunt) -> HuntDetail:
    """Sérialise une chasse pour le visiteur (étapes ordonnées, sans les codes)."""
    return HuntDetail(
        title=hunt.title,
        total_steps=len(hunt.steps),
        steps=[HuntStepOut.model_validate(step) for step in hunt.steps],
    )


def _get_or_create_session(
    db: Session, session_token: str, hunt_id: int
) -> AnonymousSession:
    """Retrouve la progression (token, chasse) ou la crée au premier scan."""
    session = db.scalar(
        select(AnonymousSession).where(
            AnonymousSession.session_token == session_token,
            AnonymousSession.hunt_id == hunt_id,
        )
    )
    if session is None:
        session = AnonymousSession(
            session_token=session_token, hunt_id=hunt_id, current_step=0, completed=False
        )
        db.add(session)
        db.flush()
    return session


def validate_step(
    db: Session, experience_public_id: str, session_token: str, code: str
) -> StepValidationResponse:
    """Valide le code scanné contre l'étape ATTENDUE pour cette session.

    Anti-triche : on ne compare le code qu'à l'étape `current_step + 1`. Un code
    d'une autre étape (saut en avant) ou erroné est refusé sans faire avancer.
    """
    hunt = get_published_hunt(db, experience_public_id)
    total_steps = len(hunt.steps)
    session = _get_or_create_session(db, session_token, hunt.id)

    # Chasse déjà terminée : on renvoie la récompense sans rien changer (idempotent).
    if session.completed:
        db.commit()
        return StepValidationResponse(
            correct=False,
            completed=True,
            current_step=session.current_step,
            total_steps=total_steps,
            message="Chasse déjà terminée.",
            reward=hunt.reward_message,
        )

    # Étape attendue = la suivante non encore validée.
    next_order = session.current_step + 1
    next_step = next((s for s in hunt.steps if s.step_order == next_order), None)

    # Mauvais code, ou code d'une étape non attendue (désordre / saut) → refus.
    if next_step is None or code != next_step.validation_code:
        db.commit()  # persiste la session créée au premier scan, sans avancer
        return StepValidationResponse(
            correct=False,
            completed=False,
            current_step=session.current_step,
            total_steps=total_steps,
            message="Code incorrect : scanne l'étape attendue, dans l'ordre.",
        )

    # Code correct → on avance d'une étape.
    session.current_step = next_order
    session.completed = session.current_step >= total_steps
    db.commit()

    if session.completed:
        return StepValidationResponse(
            correct=True,
            completed=True,
            current_step=session.current_step,
            total_steps=total_steps,
            message="Bravo, chasse terminée !",
            reward=hunt.reward_message,
        )
    return StepValidationResponse(
        correct=True,
        completed=False,
        current_step=session.current_step,
        total_steps=total_steps,
        message=f"Étape {session.current_step} validée.",
    )
