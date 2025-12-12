"""
統一配置管理服務
遵循 Clean Code 原則：單一職責、依賴反轉
"""
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class Environment(Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"


@dataclass
class ServiceConfig:
    """服務配置數據類"""
    name: str
    host: str
    port: int
    environment: Environment
    database_url: Optional[str] = None
    redis_url: Optional[str] = None
    dependencies: Dict[str, str] = None
    
    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = {}


class ConfigServiceInterface(ABC):
    """配置服務抽象介面"""
    
    @abstractmethod
    def get_service_config(self, service_name: str) -> ServiceConfig:
        """獲取服務配置"""
        pass
    
    @abstractmethod
    def get_environment(self) -> Environment:
        """獲取當前環境"""
        pass
    
    @abstractmethod
    def get_service_url(self, service_name: str) -> str:
        """獲取服務 URL"""
        pass


class EnvironmentConfigService(ConfigServiceInterface):
    """基於環境變數的配置服務實作"""
    
    def __init__(self):
        self._environment = self._detect_environment()
        self._service_configs = self._load_service_configs()
    
    def _detect_environment(self) -> Environment:
        """檢測當前環境"""
        env_str = os.getenv("NODE_ENV", "development").lower()
        try:
            return Environment(env_str)
        except ValueError:
            return Environment.DEVELOPMENT
    
    def _load_service_configs(self) -> Dict[str, ServiceConfig]:
        """載入所有服務配置"""
        configs = {}
        
        # User Core Service (基礎服務，無依賴)
        configs["user-core"] = ServiceConfig(
            name="user-core",
            host=os.getenv("USER_CORE_HOST", "localhost"),
            port=int(os.getenv("USER_CORE_PORT", "8001")),
            environment=self._environment,
            database_url=os.getenv("USER_CORE_DB_URL"),
        )
        
        # Resort API (基礎服務)
        configs["resort-api"] = ServiceConfig(
            name="resort-api",
            host=os.getenv("RESORT_API_HOST", "localhost"),
            port=int(os.getenv("RESORT_API_PORT", "8000")),
            environment=self._environment,
        )
        
        # 計算依賴 URL（避免循環依賴）
        user_core_url = f"http://{configs['user-core'].host}:{configs['user-core'].port}"
        resort_api_url = f"http://{configs['resort-api'].host}:{configs['resort-api'].port}"
        
        # Calendar Service
        configs["calendar-service"] = ServiceConfig(
            name="calendar-service",
            host=os.getenv("CALENDAR_SERVICE_HOST", "localhost"),
            port=int(os.getenv("CALENDAR_SERVICE_PORT", "8003")),
            environment=self._environment,
            dependencies={"user-core": user_core_url}
        )
        
        # Gear Service
        configs["gear-service"] = ServiceConfig(
            name="gear-service",
            host=os.getenv("GEAR_SERVICE_HOST", "localhost"),
            port=int(os.getenv("GEAR_SERVICE_PORT", "8004")),
            environment=self._environment,
            dependencies={"user-core": user_core_url}
        )
        
        # Social Service
        configs["social-service"] = ServiceConfig(
            name="social-service",
            host=os.getenv("SOCIAL_SERVICE_HOST", "localhost"),
            port=int(os.getenv("SOCIAL_SERVICE_PORT", "8005")),
            environment=self._environment,
            dependencies={"user-core": user_core_url}
        )
        
        # 更新 Resort API 依賴
        configs["resort-api"].dependencies = {"user-core": user_core_url}
        
        # Snowbuddy Matching
        configs["snowbuddy-matching"] = ServiceConfig(
            name="snowbuddy-matching",
            host=os.getenv("SNOWBUDDY_HOST", "localhost"),
            port=int(os.getenv("SNOWBUDDY_PORT", "8002")),
            environment=self._environment,
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
            dependencies={
                "user-core": user_core_url,
                "resort-api": resort_api_url
            }
        )
        
        return configs
    
    def get_service_config(self, service_name: str) -> ServiceConfig:
        """獲取服務配置"""
        if service_name not in self._service_configs:
            raise ValueError(f"Unknown service: {service_name}")
        return self._service_configs[service_name]
    
    def get_environment(self) -> Environment:
        """獲取當前環境"""
        return self._environment
    
    def get_service_url(self, service_name: str) -> str:
        """獲取服務 URL"""
        config = self.get_service_config(service_name)
        return f"http://{config.host}:{config.port}"


# 單例模式
_config_service_instance: Optional[ConfigServiceInterface] = None


def get_config_service() -> ConfigServiceInterface:
    """獲取配置服務單例"""
    global _config_service_instance
    if _config_service_instance is None:
        _config_service_instance = EnvironmentConfigService()
    return _config_service_instance


def set_config_service(service: ConfigServiceInterface):
    """設置配置服務（主要用於測試）"""
    global _config_service_instance
    _config_service_instance = service


class MockConfigService(ConfigServiceInterface):
    """測試用的模擬配置服務"""
    
    def __init__(self):
        self.configs = {
            "user-core": ServiceConfig(
                name="user-core",
                host="localhost",
                port=8001,
                environment=Environment.TESTING
            ),
            "calendar-service": ServiceConfig(
                name="calendar-service",
                host="localhost",
                port=8003,
                environment=Environment.TESTING,
                dependencies={"user-core": "http://localhost:8001"}
            ),
            "gear-service": ServiceConfig(
                name="gear-service",
                host="localhost",
                port=8004,
                environment=Environment.TESTING,
                dependencies={"user-core": "http://localhost:8001"}
            ),
            "social-service": ServiceConfig(
                name="social-service",
                host="localhost",
                port=8005,
                environment=Environment.TESTING,
                dependencies={"user-core": "http://localhost:8001"}
            )
        }
    
    def get_service_config(self, service_name: str) -> ServiceConfig:
        if service_name not in self.configs:
            raise ValueError(f"Unknown service: {service_name}")
        return self.configs[service_name]
    
    def get_environment(self) -> Environment:
        return Environment.TESTING
    
    def get_service_url(self, service_name: str) -> str:
        config = self.get_service_config(service_name)
        return f"http://{config.host}:{config.port}"
