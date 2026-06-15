from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    cms_api_base_url: str = "https://data.cms.gov/provider-data/api/1/datastore/query"
    cms_provider_dataset_id: str = "4pq5-n9py"
    cms_claims_dataset_id: str = "ijh5-nb2v"
    cms_state_averages_dataset_id: str = "xcdc-v8bm"
    apply_case_reference_snapshot: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    backend_port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
