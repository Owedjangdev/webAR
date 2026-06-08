"""Schémas Pydantic v2 de la chasse au trésor (routes publiques visiteur).

⚠️ Sécurité : `HuntStepOut` n'expose VOLONTAIREMENT pas `validation_code`. Le code
d'une étape ne doit jamais transiter vers le visiteur (sinon il valide sans scanner).
On protège le secret en ne le mettant pas dans le modèle de sortie, pas en le
masquant après coup.
"""

from pydantic import BaseModel, ConfigDict, Field


class HuntStepOut(BaseModel):
    """Une étape telle que vue par le visiteur : SANS le validation_code."""

    model_config = ConfigDict(from_attributes=True)

    step_order: int
    title: str
    hint: str


class HuntDetail(BaseModel):
    """Réponse de GET /api/hunt/{experience_id} : la chasse et ses étapes."""

    title: str
    total_steps: int
    steps: list[HuntStepOut]


class StepValidationRequest(BaseModel):
    """Corps de POST /api/hunt/step/validate (progression anonyme).

    `experience_id` = identifiant public de l'expérience (ex. "exp_001"), connu du
    visiteur via le QR. `session_token` = identifiant anonyme côté client.
    """

    session_token: str = Field(min_length=1, max_length=64)
    experience_id: str = Field(min_length=1, max_length=50)
    code: str = Field(min_length=1, max_length=100)


class StepValidationResponse(BaseModel):
    """Résultat d'une tentative de validation d'étape."""

    correct: bool
    completed: bool
    current_step: int  # nombre d'étapes validées
    total_steps: int
    message: str
    # Récompense finale : renseignée uniquement quand la chasse est terminée.
    reward: str | None = None
