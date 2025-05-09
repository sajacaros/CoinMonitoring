from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    client_origin: str

    class Config:
        env_file = ".env"  # 현재 작업 디렉토리에서 .env 파일을 찾음
        env_file_encoding = 'utf-8' # 인코딩 설정 추가

@lru_cache()
def get_settings():
    return Settings()