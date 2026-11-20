"""
LabNexus - Application Configuration
"""
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "LabNexus"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database URL: defaults to local sqlite for zero-friction standalone run,
    # or PostgreSQL via environment variable (e.g. postgresql://postgres:postgres@localhost:5432/labnexus)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./labnexus.db")
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "labnexus-secret-key-capstone-supersecure-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Simulation defaults
    SIMULATION_INTERVAL_SECONDS: float = 2.0
    HEARTBEAT_TIMEOUT_SECONDS: float = 6.0
    SIMULATION_SPEED_MULTIPLIER: float = 1.0
    NUM_VIRTUAL_COMPUTERS: int = 10
    
    # Anomaly Thresholds
    CPU_WARNING_THRESHOLD: float = 80.0
    CPU_CRITICAL_THRESHOLD: float = 95.0
    RAM_WARNING_THRESHOLD: float = 85.0
    RAM_CRITICAL_THRESHOLD: float = 95.0
    DISK_WARNING_THRESHOLD: float = 90.0
    DISK_HEALTH_CRITICAL_THRESHOLD: float = 20.0
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
