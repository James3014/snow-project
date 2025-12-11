"""
CASI Skills API - 單一職責原則
專門處理 CASI 技能資料的 API 端點
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from services import db
from models.buddy_matching import CASISkillProfile
from schemas.buddy_matching import CASISkillProfile as CASISkillProfileSchema


router = APIRouter()


@router.get("/users/{user_id}/casi-skills", response_model=CASISkillProfileSchema)
async def get_casi_skills(
    user_id: str,
    db_session: Session = Depends(db.get_db)
) -> CASISkillProfileSchema:
    """
    獲取使用者的 CASI 技能資料
    
    供 Snowbuddy Service 調用進行技能媒合
    """
    skill_profile = db_session.query(CASISkillProfile).filter(
        CASISkillProfile.user_id == user_id
    ).first()
    
    if not skill_profile:
        raise HTTPException(
            status_code=404,
            detail="CASI skills not found for user"
        )
    
    return CASISkillProfileSchema.from_orm(skill_profile)


@router.get("/users/{user_id}/casi-skills/summary")
async def get_casi_skills_summary(
    user_id: str,
    db_session: Session = Depends(db.get_db)
) -> dict:
    """
    獲取 CASI 技能摘要 (用於媒合算法)
    
    返回簡化的技能資料，減少網路傳輸
    """
    skill_profile = db_session.query(CASISkillProfile).filter(
        CASISkillProfile.user_id == user_id
    ).first()
    
    if not skill_profile:
        # 返回預設值而非錯誤，讓媒合算法可以處理新使用者
        return {
            "user_id": user_id,
            "overall_skill": 0.0,
            "has_profile": False
        }
    
    # 計算整體技能水平
    overall_skill = (
        skill_profile.stance_balance +
        skill_profile.rotation +
        skill_profile.edging +
        skill_profile.pressure +
        skill_profile.timing_coordination
    ) / 5.0
    
    return {
        "user_id": user_id,
        "overall_skill": overall_skill,
        "has_profile": True,
        "skills": {
            "stance_balance": skill_profile.stance_balance,
            "rotation": skill_profile.rotation,
            "edging": skill_profile.edging,
            "pressure": skill_profile.pressure,
            "timing_coordination": skill_profile.timing_coordination
        }
    }
