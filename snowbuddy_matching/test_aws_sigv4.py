#!/usr/bin/env python3
"""Test AWS SigV4 signing for Lambda Function URL."""
import asyncio
import json
import os
from pathlib import Path

from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials
import httpx


async def test_lambda_function_url():
    """Test direct Lambda Function URL invocation with SigV4."""
    
    # Load credentials
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env.test")
    
    url = os.getenv("MATCHING_WORKFLOW_URL")
    region = os.getenv("AWS_REGION")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    print("=" * 60)
    print("AWS SigV4 Lambda Function URL Test")
    print("=" * 60)
    print(f"\nURL: {url}")
    print(f"Region: {region}")
    print(f"Access Key: {access_key[:10]}...")
    print(f"Secret Key: {'***' if secret_key else 'None'}")
    
    # Test 1: Simple GET to root
    print("\n🧪 Test 1: GET /")
    try:
        credentials = Credentials(
            access_key=access_key,
            secret_key=secret_key,
        )
        
        # Create AWS request
        aws_request = AWSRequest(method="GET", url=url)
        aws_request.headers["Content-Type"] = "application/json"
        
        # Sign with SigV4
        SigV4Auth(credentials, "lambda", region).add_auth(aws_request)
        
        # Make request
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=aws_request.method,
                url=aws_request.url,
                headers=dict(aws_request.headers),
            )
            
            print(f"Status: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Body: {response.text[:200]}")
            
            if response.status_code == 403:
                print("\n❌ 403 Forbidden - IAM 權限問題")
                print("   需要檢查：")
                print("   1. IAM 用戶是否有 lambda:InvokeFunctionUrl 權限")
                print("   2. Lambda Function URL 的 AuthType 設定")
                print("   3. Resource-based policy 是否允許此 IAM 用戶")
            elif response.status_code == 200:
                print("\n✅ 成功連接！")
            
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
    
    # Test 2: POST with body
    print("\n🧪 Test 2: POST /workflows/matching/start")
    try:
        test_payload = {
            "search_id": "test-001",
            "seeker_id": "user-001",
            "preferences": {
                "skill_level_min": 3,
                "skill_level_max": 7,
            },
            "timeout_seconds": 60,
        }
        
        body = json.dumps(test_payload).encode("utf-8")
        full_url = url.rstrip("/") + "/workflows/matching/start"
        
        # Create AWS request
        aws_request = AWSRequest(method="POST", url=full_url, data=body)
        aws_request.headers["Content-Type"] = "application/json"
        
        # Sign with SigV4
        SigV4Auth(credentials, "lambda", region).add_auth(aws_request)
        
        print(f"Signed headers: {list(aws_request.headers.keys())}")
        
        # Make request
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=aws_request.method,
                url=aws_request.url,
                headers=dict(aws_request.headers),
                content=body,
            )
            
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text[:500]}")
            
            if response.status_code == 403:
                print("\n❌ 403 Forbidden")
            elif response.status_code == 200:
                print("\n✅ 成功！")
                return True
            
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
    
    return False


if __name__ == "__main__":
    success = asyncio.run(test_lambda_function_url())
    exit(0 if success else 1)
