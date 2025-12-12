"""
服務間通訊介面標準
統一服務介面定義和版本管理
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
from enum import Enum
import asyncio


class ServiceVersion(Enum):
    """服務版本"""
    V1 = "v1"
    V2 = "v2"


@dataclass
class ServiceRequest:
    """標準服務請求"""
    method: str
    data: Dict[str, Any]
    headers: Dict[str, str]
    user_id: Optional[str] = None
    trace_id: Optional[str] = None
    version: ServiceVersion = ServiceVersion.V1


@dataclass
class ServiceResponse:
    """標準服務響應"""
    success: bool
    data: Any
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class ServiceInterface(ABC):
    """服務介面基類"""
    
    @property
    @abstractmethod
    def service_name(self) -> str:
        """服務名稱"""
        pass
    
    @property
    @abstractmethod
    def version(self) -> ServiceVersion:
        """服務版本"""
        pass
    
    @abstractmethod
    async def handle_request(self, request: ServiceRequest) -> ServiceResponse:
        """處理服務請求"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """健康檢查"""
        pass


class CalendarServiceInterface(ServiceInterface):
    """行事曆服務介面"""
    
    @property
    def service_name(self) -> str:
        return "calendar-service"
    
    @abstractmethod
    async def create_event(self, user_id: str, event_data: Dict[str, Any]) -> ServiceResponse:
        """建立事件"""
        pass
    
    @abstractmethod
    async def get_events(self, user_id: str, filters: Dict[str, Any] = None) -> ServiceResponse:
        """獲取事件列表"""
        pass
    
    @abstractmethod
    async def update_event(self, event_id: str, event_data: Dict[str, Any]) -> ServiceResponse:
        """更新事件"""
        pass
    
    @abstractmethod
    async def delete_event(self, event_id: str, user_id: str) -> ServiceResponse:
        """刪除事件"""
        pass


class GearServiceInterface(ServiceInterface):
    """裝備服務介面"""
    
    @property
    def service_name(self) -> str:
        return "gear-service"
    
    @abstractmethod
    async def create_gear(self, user_id: str, gear_data: Dict[str, Any]) -> ServiceResponse:
        """建立裝備"""
        pass
    
    @abstractmethod
    async def get_user_gear(self, user_id: str, filters: Dict[str, Any] = None) -> ServiceResponse:
        """獲取用戶裝備"""
        pass
    
    @abstractmethod
    async def update_gear(self, gear_id: str, gear_data: Dict[str, Any]) -> ServiceResponse:
        """更新裝備"""
        pass
    
    @abstractmethod
    async def delete_gear(self, gear_id: str, user_id: str) -> ServiceResponse:
        """刪除裝備"""
        pass


class SocialServiceInterface(ServiceInterface):
    """社交服務介面"""
    
    @property
    def service_name(self) -> str:
        return "social-service"
    
    @abstractmethod
    async def create_activity(self, user_id: str, activity_data: Dict[str, Any]) -> ServiceResponse:
        """建立活動"""
        pass
    
    @abstractmethod
    async def get_user_feed(self, user_id: str, limit: int = 20) -> ServiceResponse:
        """獲取用戶動態"""
        pass
    
    @abstractmethod
    async def follow_user(self, follower_id: str, following_id: str) -> ServiceResponse:
        """關注用戶"""
        pass
    
    @abstractmethod
    async def unfollow_user(self, follower_id: str, following_id: str) -> ServiceResponse:
        """取消關注"""
        pass


class ServiceClient:
    """服務客戶端基類"""
    
    def __init__(self, service_url: str, timeout: float = 30.0):
        self.service_url = service_url
        self.timeout = timeout
    
    async def call_service(self, request: ServiceRequest) -> ServiceResponse:
        """調用服務"""
        import httpx
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.service_url}/api/{request.method}",
                    json=request.data,
                    headers=request.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return ServiceResponse(
                        success=True,
                        data=data,
                        metadata={"status_code": response.status_code}
                    )
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    return ServiceResponse(
                        success=False,
                        data=None,
                        error_code=error_data.get("error", "UNKNOWN_ERROR"),
                        error_message=error_data.get("message", "Service call failed"),
                        metadata={"status_code": response.status_code}
                    )
                    
        except Exception as e:
            return ServiceResponse(
                success=False,
                data=None,
                error_code="SERVICE_CALL_ERROR",
                error_message=str(e)
            )


class CalendarServiceClient(ServiceClient):
    """行事曆服務客戶端"""
    
    async def create_event(self, user_id: str, event_data: Dict[str, Any]) -> ServiceResponse:
        request = ServiceRequest(
            method="events",
            data=event_data,
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)
    
    async def get_events(self, user_id: str, filters: Dict[str, Any] = None) -> ServiceResponse:
        request = ServiceRequest(
            method=f"users/{user_id}/events",
            data=filters or {},
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)


class GearServiceClient(ServiceClient):
    """裝備服務客戶端"""
    
    async def create_gear(self, user_id: str, gear_data: Dict[str, Any]) -> ServiceResponse:
        request = ServiceRequest(
            method="gear",
            data=gear_data,
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)
    
    async def get_user_gear(self, user_id: str, filters: Dict[str, Any] = None) -> ServiceResponse:
        request = ServiceRequest(
            method=f"users/{user_id}/gear",
            data=filters or {},
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)


class SocialServiceClient(ServiceClient):
    """社交服務客戶端"""
    
    async def create_activity(self, user_id: str, activity_data: Dict[str, Any]) -> ServiceResponse:
        request = ServiceRequest(
            method="activities",
            data=activity_data,
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)
    
    async def get_user_feed(self, user_id: str, limit: int = 20) -> ServiceResponse:
        request = ServiceRequest(
            method=f"users/{user_id}/feed",
            data={"limit": limit},
            headers={"X-User-Id": user_id},
            user_id=user_id
        )
        return await self.call_service(request)
