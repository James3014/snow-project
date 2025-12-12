"""
SnowTrace API Gateway
統一入口點，處理認證、路由、錯誤處理
遵循 Clean Code 原則：單一職責、依賴反轉
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import uvicorn
from typing import Dict, Any
import logging
from datetime import datetime

from services.shared.config_service import get_config_service, ConfigServiceInterface
from services.shared.service_discovery import setup_service_discovery, cleanup_service_discovery

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 獲取配置服務
config_service: ConfigServiceInterface = get_config_service()

app = FastAPI(
    title="SnowTrace API Gateway",
    description="統一 API 入口點",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 服務映射
SERVICE_ROUTES = {
    "auth": "user-core",
    "users": "user-core", 
    "resorts": "resort-api",
    "calendar": "calendar-service",
    "gear": "gear-service",
    "social": "social-service",
    "matching": "snowbuddy-matching",
    "trips": "tour"  # 注意：tour 服務使用不同端口
}

class GatewayError(Exception):
    """Gateway 專用錯誤"""
    def __init__(self, status_code: int, message: str, details: Dict[str, Any] = None):
        self.status_code = status_code
        self.message = message
        self.details = details or {}

async def get_service_url(service_name: str) -> str:
    """獲取服務 URL - 支持服務發現和負載均衡"""
    try:
        if service_name == "tour":
            # tour 服務特殊處理
            return "http://localhost:3010"
        
        # 嘗試從服務發現獲取實例並進行負載均衡
        from services.shared.service_discovery import get_service_discovery
        from services.shared.load_balancer import get_load_balancer
        
        discovery = get_service_discovery()
        load_balancer = get_load_balancer()
        
        instances = await discovery.discover_services(service_name)
        if instances:
            selected_instance = load_balancer.select_instance(instances)
            if selected_instance:
                return selected_instance.url
        
        # 回退到配置服務
        service_config = config_service.get_service_config(service_name)
        return f"http://{service_config.host}:{service_config.port}"
    except ValueError:
        raise GatewayError(404, f"Unknown service: {service_name}")

async def extract_user_context(request: Request) -> Dict[str, Any]:
    """提取用戶上下文（認證資訊）"""
    # 簡化版認證 - 從 header 提取
    user_id = request.headers.get("X-User-Id")
    auth_token = request.headers.get("Authorization")
    
    return {
        "user_id": user_id,
        "auth_token": auth_token,
        "authenticated": bool(user_id and auth_token)
    }

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """請求日誌中間件"""
    start_time = datetime.utcnow()
    
    # 記錄請求
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # 記錄響應
    duration = (datetime.utcnow() - start_time).total_seconds()
    logger.info(f"Response: {response.status_code} ({duration:.3f}s)")
    
    return response

@app.exception_handler(GatewayError)
async def gateway_error_handler(request: Request, exc: GatewayError):
    """Gateway 錯誤處理"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url)
        }
    )

@app.on_event("startup")
async def startup_event():
    """應用啟動事件"""
    await setup_service_discovery()
    logger.info("API Gateway started with service discovery")

@app.on_event("shutdown")
async def shutdown_event():
    """應用關閉事件"""
    await cleanup_service_discovery()
    logger.info("API Gateway shutdown complete")

@app.get("/health")
async def health_check():
    """Gateway 健康檢查"""
    return {
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": datetime.utcnow().isoformat(),
        "services": list(SERVICE_ROUTES.keys())
    }

@app.get("/health/services")
async def services_health_check():
    """所有服務健康檢查"""
    results = {}
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        for route_name, service_name in SERVICE_ROUTES.items():
            try:
                service_url = await get_service_url(service_name)
                response = await client.get(f"{service_url}/health")
                results[route_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "service": service_name,
                    "url": service_url,
                    "response_time": response.elapsed.total_seconds()
                }
            except Exception as e:
                results[route_name] = {
                    "status": "error",
                    "service": service_name,
                    "error": str(e)
                }
    
    return {
        "gateway": "healthy",
        "services": results,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.api_route("/api/{service_route}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_request(service_route: str, path: str, request: Request):
    """代理請求到對應的微服務"""
    
    # 檢查服務路由
    if service_route not in SERVICE_ROUTES:
        raise GatewayError(404, f"Service route not found: {service_route}")
    
    service_name = SERVICE_ROUTES[service_route]
    
    try:
        # 獲取服務 URL
        service_url = await get_service_url(service_name)
        target_url = f"{service_url}/{path}"
        
        # 提取用戶上下文
        user_context = await extract_user_context(request)
        
        # 準備請求
        headers = dict(request.headers)
        
        # 添加用戶上下文到 headers（供下游服務使用）
        if user_context["user_id"]:
            headers["X-User-Id"] = user_context["user_id"]
        
        # 獲取請求體
        body = await request.body()
        
        # 發送請求到目標服務
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            # 返回響應
            return JSONResponse(
                content=response.json() if response.headers.get("content-type", "").startswith("application/json") else {"data": response.text},
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
    except httpx.TimeoutException:
        raise GatewayError(504, f"Service timeout: {service_name}")
    except httpx.ConnectError:
        raise GatewayError(503, f"Service unavailable: {service_name}")
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        raise GatewayError(500, f"Internal gateway error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        log_level="info"
    )
