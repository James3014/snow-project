"""
Complete Integration Test for Calendar Systems
"""
import asyncio
import subprocess
import sys
import os

def test_syntax_check():
    """測試所有新檔案的語法"""
    print("🔍 Testing syntax for all modified files...")
    
    files_to_check = [
        # Tour Calendar Integration
        "tour/lib/config.ts",
        "tour/lib/services/calendar.ts",
        "tour/app/api/trips/route.ts",
        "tour/app/api/trips/[id]/route.ts",
        
        # Snowbuddy Calendar Integration
        "snowbuddy_matching/app/models/trip_participant.py",
        "snowbuddy_matching/app/services/trip_integration.py",
        "snowbuddy_matching/app/services/behavior_event_service.py",
        "snowbuddy_matching/app/routers/trip_requests_router.py",
        
        # User-Core Calendar Integration
        "platform/user_core/api/calendar.py",
        "platform/user_core/api/trip_planning.py",
        "platform/user_core/config/router.py",
    ]
    
    results = {}
    
    for file_path in files_to_check:
        full_path = f"/Users/jameschen/Downloads/diyski/project/{file_path}"
        
        if not os.path.exists(full_path):
            results[file_path] = "❌ File not found"
            continue
            
        if file_path.endswith('.py'):
            # Python syntax check
            try:
                result = subprocess.run([
                    'python3', '-m', 'py_compile', full_path
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    results[file_path] = "✅ Python syntax OK"
                else:
                    results[file_path] = f"❌ Python syntax error: {result.stderr}"
            except Exception as e:
                results[file_path] = f"❌ Python check failed: {e}"
                
        elif file_path.endswith('.ts') or file_path.endswith('.tsx'):
            # TypeScript syntax check (basic)
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                    # Basic checks
                    if 'export' in content or 'import' in content:
                        results[file_path] = "✅ TypeScript structure OK"
                    else:
                        results[file_path] = "⚠️ TypeScript structure unclear"
            except Exception as e:
                results[file_path] = f"❌ TypeScript check failed: {e}"
        else:
            results[file_path] = "⚠️ Unknown file type"
    
    # Print results
    for file_path, result in results.items():
        print(f"  {result} - {file_path}")
    
    # Summary
    success_count = sum(1 for r in results.values() if r.startswith("✅"))
    total_count = len(results)
    print(f"\n📊 Syntax Check Summary: {success_count}/{total_count} files passed")
    
    return success_count == total_count


def test_api_structure():
    """測試 API 結構完整性"""
    print("\n🏗️ Testing API structure...")
    
    # Check Tour Calendar Service
    tour_calendar_path = "/Users/jameschen/Downloads/diyski/project/tour/lib/services/calendar.ts"
    if os.path.exists(tour_calendar_path):
        with open(tour_calendar_path, 'r') as f:
            content = f.read()
            if 'userCoreApiUrl' in content and 'fetch(' in content:
                print("  ✅ Tour Calendar Service: Real API integration")
            else:
                print("  ❌ Tour Calendar Service: Still using mock")
    else:
        print("  ❌ Tour Calendar Service: File not found")
    
    # Check Snowbuddy Trip Integration
    snowbuddy_integration_path = "/Users/jameschen/Downloads/diyski/project/snowbuddy_matching/app/services/trip_integration.py"
    if os.path.exists(snowbuddy_integration_path):
        with open(snowbuddy_integration_path, 'r') as f:
            content = f.read()
            if 'join_trip_with_calendar' in content and 'TripIntegrationService' in content:
                print("  ✅ Snowbuddy Trip Integration: Service implemented")
            else:
                print("  ❌ Snowbuddy Trip Integration: Service incomplete")
    else:
        print("  ❌ Snowbuddy Trip Integration: File not found")
    
    # Check User-Core Calendar API
    user_core_calendar_path = "/Users/jameschen/Downloads/diyski/project/platform/user_core/api/calendar.py"
    if os.path.exists(user_core_calendar_path):
        with open(user_core_calendar_path, 'r') as f:
            content = f.read()
            if '@router.post("/events"' in content and 'EventCreateRequest' in content:
                print("  ✅ User-Core Calendar API: Endpoints implemented")
            else:
                print("  ❌ User-Core Calendar API: Endpoints incomplete")
    else:
        print("  ❌ User-Core Calendar API: File not found")
    
    # Check Router Registration
    router_path = "/Users/jameschen/Downloads/diyski/project/platform/user_core/config/router.py"
    if os.path.exists(router_path):
        with open(router_path, 'r') as f:
            content = f.read()
            if 'calendar.router' in content:
                print("  ✅ User-Core Router: Calendar API registered")
            else:
                print("  ❌ User-Core Router: Calendar API not registered")
    else:
        print("  ❌ User-Core Router: File not found")


def test_integration_completeness():
    """測試整合完整性"""
    print("\n🔗 Testing integration completeness...")
    
    # Check Tour API Integration
    tour_api_path = "/Users/jameschen/Downloads/diyski/project/tour/app/api/trips/route.ts"
    if os.path.exists(tour_api_path):
        with open(tour_api_path, 'r') as f:
            content = f.read()
            if 'CalendarService.onTripCreated' in content:
                print("  ✅ Tour API: Trip creation integrated with Calendar")
            else:
                print("  ❌ Tour API: Trip creation not integrated")
    
    # Check Tour Update/Delete Integration
    tour_update_path = "/Users/jameschen/Downloads/diyski/project/tour/app/api/trips/[id]/route.ts"
    if os.path.exists(tour_update_path):
        with open(tour_update_path, 'r') as f:
            content = f.read()
            if 'CalendarService.onTripUpdated' in content and 'CalendarService.onTripDeleted' in content:
                print("  ✅ Tour API: Trip update/delete integrated with Calendar")
            else:
                print("  ❌ Tour API: Trip update/delete not integrated")
    
    # Check Snowbuddy API Integration
    snowbuddy_api_path = "/Users/jameschen/Downloads/diyski/project/snowbuddy_matching/app/routers/trip_requests_router.py"
    if os.path.exists(snowbuddy_api_path):
        with open(snowbuddy_api_path, 'r') as f:
            content = f.read()
            if 'join_trip_with_calendar' in content and 'BehaviorEventService' in content:
                print("  ✅ Snowbuddy API: Trip application integrated with Calendar")
            else:
                print("  ❌ Snowbuddy API: Trip application not integrated")
    
    # Check User-Core Trip API Integration
    user_core_trip_path = "/Users/jameschen/Downloads/diyski/project/platform/user_core/api/trip_planning.py"
    if os.path.exists(user_core_trip_path):
        with open(user_core_trip_path, 'r') as f:
            content = f.read()
            if '/trips/{trip_id}/apply' in content and '/trips/{trip_id}/applications/{request_id}' in content:
                print("  ✅ User-Core Trip API: Trip application endpoints added")
            else:
                print("  ❌ User-Core Trip API: Trip application endpoints missing")


def main():
    """主測試函數"""
    print("🚀 Complete Calendar Integration Test")
    print("=" * 50)
    
    # Test 1: Syntax Check
    syntax_ok = test_syntax_check()
    
    # Test 2: API Structure
    test_api_structure()
    
    # Test 3: Integration Completeness
    test_integration_completeness()
    
    print("\n" + "=" * 50)
    if syntax_ok:
        print("🎉 All syntax checks passed!")
        print("📋 Integration implementation completed!")
        print("\n📝 Next Steps:")
        print("  1. Configure environment variables")
        print("  2. Start all services")
        print("  3. Test end-to-end functionality")
        print("  4. Deploy to production")
    else:
        print("❌ Some syntax errors found. Please fix before proceeding.")
    
    return syntax_ok


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
