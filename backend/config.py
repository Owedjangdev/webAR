"""Configuration de l'application, lue depuis l'environnement / le fichier .env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de configuration du backend.

    Les valeurs sont lues automatiquement depuis les variables d'environnement
    ou le fichier .env (jamais versionné). Voir .env.example pour le modèle.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # URL de connexion MySQL, ex. mysql+pymysql://user:pass@localhost:3306/webar
    database_url: str

    # Origines autorisées par CORS (frontend React), séparées par des virgules.
    cors_origins: str = "http://localhost:5173"

    # Affiche les requêtes SQL dans la console (utile en dev, à laisser à false en prod).
    sql_echo: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Transforme la chaîne CORS_ORIGINS en liste d'origines nettoyées."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


# Instance unique partagée dans toute l'application.
settings = Settings()
