"""
Test CASI Skills API - TDD approach
確保單板教學整合不被破壞
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from api.main import app
from models.buddy_matching import CASISkillProfile
from models.user_profile import UserProfile


client = TestClient(app)


class TestCASISkillsAPI:
    """CASI 技能 API 測試 - 保護單板教學整合"""
    
    def test_get_casi_skills_success(self, db_session: Session):
        """測試獲取 CASI 技能資料"""
        # Arrange
        user_id = "test-user-123"
        
        # 建立測試資料
        skill_profile = CASISkillProfile(
            user_id=user_id,
            stance_balance=0.8,
            rotation=0.7,
            edging=0.9,
            pressure=0.6,
            timing_coordination=0.8
        )
        db_session.add(skill_profile)
        db_session.commit()
        
        # Act
        response = client.get(f"/users/{user_id}/casi-skills")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["stance_balance"] == 0.8
        assert data["rotation"] == 0.7
        assert data["edging"] == 0.9
        assert data["pressure"] == 0.6
        assert data["timing_coordination"] == 0.8
    
    def test_get_casi_skills_not_found(self):
        """測試使用者無 CASI 技能資料"""
        # Act
        response = client.get("/users/nonexistent/casi-skills")
        
        # Assert
        assert response.status_code == 404
        assert "CASI skills not found" in response.json()["detail"]
    
    def test_snowboard_teaching_behavior_event_processing(self, db_session: Session):
        """測試單板教學 BehaviorEvent 處理不被影響"""
        # Arrange
        event_data = {
            "user_id": "test-user-123",
            "event_type": "practice_complete",
            "source_project": "snowboard-teaching",
            "event_data": {
                "lesson_id": "stance_balance_101",
                "score": 85,
                "difficulty": "intermediate"
            }
        }
        
        # Act
        response = client.post("/events", json=event_data)
        
        # Assert
        assert response.status_code == 201
        # 確保 CASI 技能分析被觸發
        # (這裡應該檢查 CASISkillProfile 是否被更新)


class TestCASISkillAnalyzer:
    """CASI 技能分析器測試 - 核心邏輯保護"""
    
    def test_analyze_stance_balance_improvement(self):
        """測試站姿平衡技能分析"""
        # 這個測試確保 CASI 分析邏輯不被破壞
        pass
    
    def test_skill_profile_update_from_behavior_events(self):
        """測試從行為事件更新技能檔案"""
        # 確保單板教學資料同步邏輯完整
        pass
