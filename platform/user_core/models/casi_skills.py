"""
CASI Skills Models - 單一職責原則
專門處理 CASI 技能相關的資料模型
從 buddy_matching.py 分離出來，避免耦合
"""
from sqlalchemy import (
    Column, String, DateTime, Float, ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, UTC

from .user_profile import Base


class CASISkillProfile(Base):
    """
    CASI (Canadian Association of Snowboard Instructors) 技能檔案
    
    單一職責：儲存和管理使用者的 CASI 五大核心技能
    與單板教學系統整合，供媒合系統使用
    """
    __tablename__ = 'casi_skill_profiles'

    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey('user_profiles.user_id'),
        primary_key=True
    )

    # CASI 五大核心技能 (0.0 - 1.0 範圍)
    stance_balance = Column(Float, nullable=False, default=0.0)      # 站姿與平衡
    rotation = Column(Float, nullable=False, default=0.0)            # 旋轉
    edging = Column(Float, nullable=False, default=0.0)              # 用刃
    pressure = Column(Float, nullable=False, default=0.0)            # 壓力
    timing_coordination = Column(Float, nullable=False, default=0.0) # 時機與協調性

    # 元資料
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC), 
        nullable=False
    )

    # 關係
    user = relationship("UserProfile", backref="casi_skill_profile")

    # 約束條件
    __table_args__ = (
        CheckConstraint(
            'stance_balance >= 0 AND stance_balance <= 1',
            name='check_stance_balance_range'
        ),
        CheckConstraint(
            'rotation >= 0 AND rotation <= 1',
            name='check_rotation_range'
        ),
        CheckConstraint(
            'edging >= 0 AND edging <= 1',
            name='check_edging_range'
        ),
        CheckConstraint(
            'pressure >= 0 AND pressure <= 1',
            name='check_pressure_range'
        ),
        CheckConstraint(
            'timing_coordination >= 0 AND timing_coordination <= 1',
            name='check_timing_coordination_range'
        ),
    )

    def get_overall_skill_level(self) -> float:
        """計算整體技能水平"""
        return (
            self.stance_balance +
            self.rotation +
            self.edging +
            self.pressure +
            self.timing_coordination
        ) / 5.0

    def get_skill_vector(self) -> list[float]:
        """獲取技能向量 (供媒合算法使用)"""
        return [
            self.stance_balance,
            self.rotation,
            self.edging,
            self.pressure,
            self.timing_coordination
        ]
