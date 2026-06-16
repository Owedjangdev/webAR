"""Logique métier de la chasse au trésor (lecture + progression anonyme).

Centralise ici (et nulle part ailleurs) :
- la résolution « expérience publique -> chasse » avec ses règles d'accès (404) ;
- la sérialisation ORM -> schéma de réponse (sans exposer les validation_code) ;
- la validation d'étape avec anti-triche (ordre imposé), pour garder le router mince.
"""

import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import AnonymousSession, Experience, ExperienceStatus, Hunt, HuntStep
from schemas.hunt import (
    HuntAdminDetail,
    HuntDetail,
    HuntProgress,
    HuntStepAdminOut,
    HuntStepOut,
    HuntUpsert,
    StepValidationResponse,
)

# Une chasse n'existe que pour une expérience de ce template.
_TREASURE_HUNT_TEMPLATE = "treasure_hunt"

# Codes de validation auto-générés (encodés dans les QR d'étapes).
_STEP_CODE_LENGTH = 6
_STEP_CODE_ALPHABET = string.ascii_uppercase + string.digits


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


def get_progress(
    db: Session, experience_public_id: str, session_token: str
) -> HuntProgress:
    """Progression d'une session sur une chasse publiée (pour reprendre).

    Pas de session encore = pas commencé (0). N'avance rien (lecture seule).
    """
    hunt = get_published_hunt(db, experience_public_id)
    total_steps = len(hunt.steps)
    session = db.scalar(
        select(AnonymousSession).where(
            AnonymousSession.session_token == session_token,
            AnonymousSession.hunt_id == hunt.id,
        )
    )
    if session is None:
        return HuntProgress(current_step=0, total_steps=total_steps, completed=False)
    return HuntProgress(
        current_step=session.current_step,
        total_steps=total_steps,
        completed=session.completed,
        reward=hunt.reward_message if session.completed else None,
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


# ---------------------------------------------------------------------------
# Administration de la chasse (réservé /api/admin/*). Nombre d'étapes LIBRE.
# ---------------------------------------------------------------------------


def _get_treasure_experience_or_404(db: Session, experience_public_id: str) -> Experience:
    """Retourne l'expérience si elle existe ET est de template treasure_hunt.

    404 si inconnue ; 422 si l'expérience n'est pas une chasse (mauvais template).
    """
    experience = db.scalar(
        select(Experience).where(Experience.public_id == experience_public_id)
    )
    if experience is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expérience '{experience_public_id}' introuvable.",
        )
    if experience.template != _TREASURE_HUNT_TEMPLATE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cette expérience n'est pas une chasse au trésor (template 'treasure_hunt').",
        )
    return experience


def _generate_step_code(used: set[str]) -> str:
    """Génère un code de validation unique (parmi `used`)."""
    while True:
        code = "".join(secrets.choice(_STEP_CODE_ALPHABET) for _ in range(_STEP_CODE_LENGTH))
        if code not in used:
            used.add(code)
            return code


def to_admin_detail(hunt: Hunt) -> HuntAdminDetail:
    """Sérialise une chasse pour l'admin (codes inclus, pour générer les QR)."""
    return HuntAdminDetail(
        title=hunt.title,
        reward_message=hunt.reward_message,
        total_steps=len(hunt.steps),
        steps=[HuntStepAdminOut.model_validate(step) for step in hunt.steps],
    )


def get_hunt_admin(db: Session, experience_public_id: str) -> HuntAdminDetail:
    """Retourne la chasse (codes inclus) d'une expérience treasure_hunt.

    404 si l'expérience n'a pas encore de chasse configurée (le front affiche un
    formulaire vide).
    """
    experience = _get_treasure_experience_or_404(db, experience_public_id)
    if experience.hunt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune chasse configurée pour cette expérience.",
        )
    return to_admin_detail(experience.hunt)


def upsert_hunt(
    db: Session, experience_public_id: str, payload: HuntUpsert
) -> HuntAdminDetail:
    """Crée ou remplace la chasse d'une expérience treasure_hunt (1..N étapes).

    Les codes des étapes existantes sont CONSERVÉS par ordre (pour ne pas invalider
    les QR déjà imprimés) ; les nouvelles étapes reçoivent un code généré.
    """
    experience = _get_treasure_experience_or_404(db, experience_public_id)

    hunt = experience.hunt
    if hunt is None:
        hunt = Hunt(
            experience_id=experience.id,
            title=payload.title,
            reward_message=payload.reward_message,
        )
        db.add(hunt)
        db.flush()
        existing_codes_by_order: dict[int, str] = {}
    else:
        hunt.title = payload.title
        hunt.reward_message = payload.reward_message
        # Mémorise les codes par ordre avant de remplacer les étapes.
        existing_codes_by_order = {s.step_order: s.validation_code for s in hunt.steps}
        hunt.steps.clear()
        db.flush()  # applique la suppression avant de ré-insérer (contrainte d'ordre)

    used: set[str] = set(existing_codes_by_order.values())
    for index, step in enumerate(payload.steps, start=1):
        code = existing_codes_by_order.get(index) or _generate_step_code(used)
        hunt.steps.append(
            HuntStep(step_order=index, title=step.title, hint=step.hint, validation_code=code)
        )

    db.commit()
    db.refresh(hunt)
    return to_admin_detail(hunt)


def get_step_code(db: Session, experience_public_id: str, step_order: int) -> str:
    """Retourne le validation_code d'une étape (pour générer son QR). 404 sinon."""
    experience = _get_treasure_experience_or_404(db, experience_public_id)
    if experience.hunt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune chasse configurée pour cette expérience.",
        )
    step = next((s for s in experience.hunt.steps if s.step_order == step_order), None)
    if step is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Étape {step_order} introuvable.",
        )
    return step.validation_code
