"""
介面版本管理系統
支持 API 版本控制和向後相容
"""
from typing import Dict, Any, Optional, Callable, List
from dataclasses import dataclass
from enum import Enum
import re


class VersionStrategy(Enum):
    """版本策略"""
    HEADER = "header"        # 通過 Header 指定版本
    URL_PATH = "url_path"    # 通過 URL 路徑指定版本
    QUERY_PARAM = "query"    # 通過查詢參數指定版本


@dataclass
class ApiVersion:
    """API 版本"""
    major: int
    minor: int
    patch: int = 0
    
    def __str__(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, ApiVersion):
            return False
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)
    
    def __lt__(self, other) -> bool:
        if not isinstance(other, ApiVersion):
            return NotImplemented
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)
    
    def __le__(self, other) -> bool:
        return self == other or self < other
    
    def __gt__(self, other) -> bool:
        return not self <= other
    
    def __ge__(self, other) -> bool:
        return not self < other
    
    @classmethod
    def parse(cls, version_str: str) -> 'ApiVersion':
        """解析版本字符串"""
        # 支持格式: v1.2.3, 1.2.3, v1.2, 1.2, v1, 1
        pattern = r'^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$'
        match = re.match(pattern, version_str.strip())
        
        if not match:
            raise ValueError(f"Invalid version format: {version_str}")
        
        major = int(match.group(1))
        minor = int(match.group(2)) if match.group(2) else 0
        patch = int(match.group(3)) if match.group(3) else 0
        
        return cls(major, minor, patch)
    
    def is_compatible_with(self, other: 'ApiVersion') -> bool:
        """檢查版本相容性"""
        # 主版本號相同且當前版本不低於目標版本
        return self.major == other.major and self >= other


@dataclass
class VersionedEndpoint:
    """版本化端點"""
    version: ApiVersion
    handler: Callable
    deprecated: bool = False
    deprecation_message: Optional[str] = None


class VersionManager:
    """版本管理器"""
    
    def __init__(self, strategy: VersionStrategy = VersionStrategy.HEADER):
        self.strategy = strategy
        self._endpoints: Dict[str, List[VersionedEndpoint]] = {}
        self._default_version: Optional[ApiVersion] = None
    
    def set_default_version(self, version: ApiVersion):
        """設置預設版本"""
        self._default_version = version
    
    def register_endpoint(
        self,
        path: str,
        version: ApiVersion,
        handler: Callable,
        deprecated: bool = False,
        deprecation_message: Optional[str] = None
    ):
        """註冊版本化端點"""
        if path not in self._endpoints:
            self._endpoints[path] = []
        
        endpoint = VersionedEndpoint(
            version=version,
            handler=handler,
            deprecated=deprecated,
            deprecation_message=deprecation_message
        )
        
        self._endpoints[path].append(endpoint)
        # 按版本排序，最新版本在前
        self._endpoints[path].sort(key=lambda x: x.version, reverse=True)
    
    def get_handler(self, path: str, requested_version: Optional[ApiVersion] = None) -> tuple[Callable, Optional[str]]:
        """獲取處理器"""
        if path not in self._endpoints:
            raise ValueError(f"Endpoint not found: {path}")
        
        endpoints = self._endpoints[path]
        
        # 如果沒有指定版本，使用預設版本或最新版本
        if requested_version is None:
            requested_version = self._default_version or endpoints[0].version
        
        # 尋找相容的版本
        compatible_endpoint = None
        for endpoint in endpoints:
            if endpoint.version.is_compatible_with(requested_version):
                compatible_endpoint = endpoint
                break
        
        if compatible_endpoint is None:
            # 如果沒有相容版本，嘗試使用最接近的較新版本
            for endpoint in endpoints:
                if endpoint.version > requested_version:
                    compatible_endpoint = endpoint
                    break
        
        if compatible_endpoint is None:
            raise ValueError(f"No compatible version found for {path} version {requested_version}")
        
        # 返回處理器和棄用警告
        warning = None
        if compatible_endpoint.deprecated:
            warning = compatible_endpoint.deprecation_message or f"API version {compatible_endpoint.version} is deprecated"
        
        return compatible_endpoint.handler, warning
    
    def extract_version_from_request(self, request_data: Dict[str, Any]) -> Optional[ApiVersion]:
        """從請求中提取版本"""
        version_str = None
        
        if self.strategy == VersionStrategy.HEADER:
            headers = request_data.get('headers', {})
            version_str = headers.get('API-Version') or headers.get('Accept-Version')
        
        elif self.strategy == VersionStrategy.URL_PATH:
            path = request_data.get('path', '')
            # 提取路徑中的版本，如 /api/v1/users
            match = re.search(r'/v(\d+(?:\.\d+)?(?:\.\d+)?)/', path)
            if match:
                version_str = f"v{match.group(1)}"
        
        elif self.strategy == VersionStrategy.QUERY_PARAM:
            query_params = request_data.get('query_params', {})
            version_str = query_params.get('version') or query_params.get('api_version')
        
        if version_str:
            try:
                return ApiVersion.parse(version_str)
            except ValueError:
                pass
        
        return None
    
    def get_available_versions(self, path: str) -> List[ApiVersion]:
        """獲取可用版本列表"""
        if path not in self._endpoints:
            return []
        
        return [endpoint.version for endpoint in self._endpoints[path]]
    
    def deprecate_version(self, path: str, version: ApiVersion, message: Optional[str] = None):
        """標記版本為棄用"""
        if path not in self._endpoints:
            return
        
        for endpoint in self._endpoints[path]:
            if endpoint.version == version:
                endpoint.deprecated = True
                endpoint.deprecation_message = message
                break


class VersionedServiceInterface:
    """版本化服務介面"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.version_manager = VersionManager()
    
    def register_v1_endpoints(self):
        """註冊 v1 端點"""
        pass
    
    def register_v2_endpoints(self):
        """註冊 v2 端點"""
        pass
    
    async def handle_versioned_request(self, path: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """處理版本化請求"""
        # 提取版本
        requested_version = self.version_manager.extract_version_from_request(request_data)
        
        try:
            # 獲取處理器
            handler, warning = self.version_manager.get_handler(path, requested_version)
            
            # 執行處理器
            result = await handler(request_data)
            
            # 添加版本資訊到響應
            response = {
                "data": result,
                "api_version": str(requested_version or self.version_manager._default_version),
                "service": self.service_name
            }
            
            if warning:
                response["warning"] = warning
            
            return response
            
        except ValueError as e:
            return {
                "error": str(e),
                "available_versions": [str(v) for v in self.version_manager.get_available_versions(path)],
                "service": self.service_name
            }


# 裝飾器支援
def versioned(version: str, deprecated: bool = False, deprecation_message: str = None):
    """版本化裝飾器"""
    def decorator(func):
        func._api_version = ApiVersion.parse(version)
        func._deprecated = deprecated
        func._deprecation_message = deprecation_message
        return func
    return decorator


# 預定義版本
V1_0 = ApiVersion(1, 0, 0)
V1_1 = ApiVersion(1, 1, 0)
V2_0 = ApiVersion(2, 0, 0)
