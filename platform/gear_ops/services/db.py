"""
Database connection and session management

簡單直接的数据库连接，不過度設計
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
import os

from config import settings

# Create engine
engine = create_engine(
    settings.gear_db_url,
    pool_pre_ping=True,  # 确保连接有效
    pool_size=5,
    max_overflow=10
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """FastAPI dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database session (for scripts)"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
