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


# ---------------------------------------------------------------------------
# Schémas ADMIN (réservés /api/admin/*). Ici, contrairement au visiteur, on
# EXPOSE le validation_code : l'admin/le partenaire en a besoin pour générer et
# imprimer les QR d'étapes. Nombre d'étapes LIBRE (1..N).
# ---------------------------------------------------------------------------


class HuntStepIn(BaseModel):
    """Une étape fournie par l'admin (l'ordre = position dans la liste ; le code
    de validation est généré automatiquement côté serveur)."""

    title: str = Field(min_length=1, max_length=255)
    hint: str = Field(min_length=1, max_length=500)


class HuntUpsert(BaseModel):
    """Corps de PUT /api/admin/hunt/{experience_id} : crée ou remplace la chasse.

    `steps` : 1 à N étapes, dans l'ordre voulu (la 1ʳᵉ de la liste = étape 1).
    """

    title: str = Field(min_length=1, max_length=255)
    reward_message: str = Field(min_length=1, max_length=500)
    steps: list[HuntStepIn] = Field(min_length=1)


class HuntStepAdminOut(BaseModel):
    """Une étape vue par l'admin : AVEC son code (pour générer/imprimer son QR)."""

    model_config = ConfigDict(from_attributes=True)

    step_order: int
    title: str
    hint: str
    validation_code: str


class HuntAdminDetail(BaseModel):
    """Réponse admin : la chasse complète, codes inclus."""

    title: str
    reward_message: str
    total_steps: int
    steps: list[HuntStepAdminOut]


class HuntProgress(BaseModel):
    """Progression d'une session anonyme (pour reprendre au bon endroit).

    Le serveur fait foi : le frontend affiche l'indice de `current_step + 1`.
    """

    current_step: int  # nombre d'étapes validées (0 = pas commencé)
    total_steps: int
    completed: bool
    # Récompense : renseignée seulement si la chasse est terminée.
    reward: str | None = None
