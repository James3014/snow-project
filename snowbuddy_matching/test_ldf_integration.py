#!/usr/bin/env python3
"""Test LDF (Lambda Durable Functions) integration for Snowbuddy Matching."""
import asyncio
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import get_settings
from app.services.workflow_clients import get_matching_workflow_client
from app.models.matching import MatchingPreference


async def test_workflow_client():
    """Test workflow client initialization and basic connectivity."""
    print("=" * 60)
    print("LDF Integration Test")
    print("=" * 60)
    
    settings = get_settings()
    
    # Display configuration
    print("\n📋 Configuration:")
    print(f"  MATCHING_WORKFLOW_URL: {settings.matching_workflow_url}")
    print(f"  AUTH_MODE: {settings.matching_workflow_auth_mode}")
    print(f"  AWS_REGION: {settings.aws_region}")
    print(f"  AWS_ACCESS_KEY_ID: {settings.aws_access_key_id[:10]}..." if settings.aws_access_key_id else "  AWS_ACCESS_KEY_ID: None")
    print(f"  AWS_SECRET_ACCESS_KEY: {'***' if settings.aws_secret_access_key else 'None'}")
    
    # Check if workflow is configured
    if not settings.matching_workflow_url:
        print("\n⚠️  MATCHING_WORKFLOW_URL not configured")
        print("   Will fallback to Redis background tasks")
        return False
    
    # Get workflow client
    try:
        client = get_matching_workflow_client()
        if not client:
            print("\n⚠️  Workflow client not initialized (missing credentials?)")
            return False
        
        print("\n✅ Workflow client initialized")
    except Exception as e:
        print(f"\n❌ Failed to initialize workflow client: {e}")
        return False
    
    # Test workflow invocation
    print("\n🧪 Testing workflow invocation...")
    
    test_preferences = MatchingPreference(
        skill_level_min=3,
        skill_level_max=7,
        preferred_resorts=["hokkaido_niseko_moiwa"],
        preferred_regions=["Hokkaido"],
        availability=[],
        seeking_role="buddy",
        include_knowledge_score=True,
    )
    
    try:
        result = await client.start_matching_workflow(
            search_id="test-search-001",
            seeker_id="test-user-001",
            seeker_preferences=test_preferences.model_dump(),
            callback_webhook=settings.matching_workflow_callback_url,
            timeout_seconds=60,  # Short timeout for testing
        )
        
        print(f"\n✅ Workflow started successfully!")
        print(f"   Response: {result}")
        return True
        
    except Exception as e:
        print(f"\n❌ Workflow invocation failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        if hasattr(e, 'response'):
            print(f"   Response: {e.response}")
        return False


async def test_fallback_mode():
    """Test Redis fallback mode."""
    print("\n" + "=" * 60)
    print("Testing Fallback Mode (Redis)")
    print("=" * 60)
    
    from app.services.matching_service import get_matching_service
    
    try:
        service = get_matching_service()
        print("\n✅ Matching service initialized")
        print("   Redis fallback mode available")
        return True
    except Exception as e:
        print(f"\n❌ Failed to initialize matching service: {e}")
        return False


async def main():
    """Run all tests."""
    print("\n🚀 Starting LDF Integration Tests\n")
    
    # Load environment
    env_file = Path(__file__).parent / ".env.test"
    if env_file.exists():
        print(f"📄 Loading environment from: {env_file}")
        from dotenv import load_dotenv
        load_dotenv(env_file)
    else:
        print("⚠️  No .env.test file found, using system environment")
    
    # Test workflow mode
    workflow_ok = await test_workflow_client()
    
    # Test fallback mode
    fallback_ok = await test_fallback_mode()
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"  LDF Workflow Mode: {'✅ PASS' if workflow_ok else '❌ FAIL'}")
    print(f"  Redis Fallback Mode: {'✅ PASS' if fallback_ok else '❌ FAIL'}")
    
    if workflow_ok:
        print("\n🎉 LDF integration is working!")
        print("   Snowbuddy can use Lambda Durable Functions")
    elif fallback_ok:
        print("\n⚠️  LDF not available, but fallback mode works")
        print("   Snowbuddy will use Redis background tasks")
    else:
        print("\n❌ Both modes failed - check configuration")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
