from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MYSQL_URI: str
    MONGO_URI: str
    DATABASE_NAME: str = "collabspace_boards"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS — comma-separated origins, or "*" to allow all (dev only)
    # Example prod: "https://collabspace.com,https://www.collabspace.com"
    ALLOWED_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()