"""
Test Snowbuddy Calendar Integration
"""
import asyncio
import sys
import os

# 添加路徑
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'snowbuddy_matching'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'platform/user_core'))

async def test_integration():
    """測試 Snowbuddy Calendar 整合"""
    print("🧪 Testing Snowbuddy Calendar Integration...")
    
    # Test 1: 檢查模型
    print("\n1. Testing TripParticipant model...")
    try:
        from snowbuddy_matching.app.models.trip_participant import TripParticipant
        
        participant = TripParticipant(
            trip_id="test_trip_123",
            user_id="test_user_456",
            status="confirmed"
        )
        print(f"✅ TripParticipant model: {participant.model_dump()}")
    except Exception as e:
        print(f"❌ TripParticipant model error: {e}")
    
    # Test 2: 檢查服務
    print("\n2. Testing TripIntegrationService...")
    try:
        from snowbuddy_matching.app.services.trip_integration import TripIntegrationService
        
        service = TripIntegrationService()
        print("✅ TripIntegrationService created successfully")
        
        # 測試方法存在
        assert hasattr(service, 'join_trip_with_calendar')
        assert hasattr(service, 'leave_trip_with_calendar')
        print("✅ Required methods exist")
        
    except Exception as e:
        print(f"❌ TripIntegrationService error: {e}")
    
    # Test 3: 檢查 API 路由
    print("\n3. Testing API routes...")
    try:
        from snowbuddy_matching.app.routers.trip_requests_router import router
        
        # 檢查路由是否有正確的端點
        routes = [route.path for route in router.routes]
        expected_routes = [
            "/trips/{trip_id}/apply",
            "/trips/{trip_id}/applications/{request_id}",
            "/trips/{trip_id}/participants/{user_id}"
        ]
        
        for expected in expected_routes:
            if any(expected in route for route in routes):
                print(f"✅ Route found: {expected}")
            else:
                print(f"❌ Route missing: {expected}")
                
    except Exception as e:
        print(f"❌ API routes error: {e}")
    
    # Test 4: 檢查 user-core API
    print("\n4. Testing user-core trip API...")
    try:
        # 檢查語法
        import subprocess
        result = subprocess.run([
            'python3', '-m', 'py_compile', 
            'platform/user_core/api/trip_planning.py'
        ], capture_output=True, text=True, cwd='.')
        
        if result.returncode == 0:
            print("✅ user-core trip API syntax OK")
        else:
            print(f"❌ user-core trip API syntax error: {result.stderr}")
            
    except Exception as e:
        print(f"❌ user-core API test error: {e}")
    
    print("\n🎉 Integration test completed!")


if __name__ == "__main__":
    asyncio.run(test_integration())
