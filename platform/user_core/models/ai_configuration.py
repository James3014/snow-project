"""
AI Configuration Models
AI 配置數據模型
"""
from sqlalchemy import Column, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AIConfiguration(Base):
    """AI 配置表"""
    __tablename__ = "ai_configurations"

    config_id = Column(String, primary_key=True, default="default")
    provider = Column(String, nullable=False)  # openai | anthropic | gemini
    model = Column(String, nullable=False)
    api_key = Column(String, nullable=False)  # 加密存儲
    temperature = Column(Float, default=0.7)
    is_active = Column(Boolean, default=True)

    # 備用配置（fallback）
    fallback_provider = Column(String, nullable=True)
    fallback_model = Column(String, nullable=True)
    fallback_api_key = Column(String, nullable=True)
