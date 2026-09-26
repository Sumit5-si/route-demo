import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "EVoyage AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Environment & Demo Mode
    DEMO_MODE: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Supabase Configuration
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY", "")
    
    # Google Maps API Key
    GOOGLE_MAPS_API_KEY: Optional[str] = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # Safety Margins
    MINIMUM_ARRIVAL_SOC: float = 10.0   # Hard cut-off percentage
    PREFERRED_ARRIVAL_SOC: float = 15.0 # Preferred safety reserve percentage
    DEFAULT_SAFETY_BUFFER: float = 0.12 # 12% buffer on energy for unexpected delays/AC
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
