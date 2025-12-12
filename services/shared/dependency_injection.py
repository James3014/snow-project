"""
依賴注入容器
管理服務依賴和生命週期
"""
from typing import Dict, Any, Type, TypeVar, Callable, Optional, Union
from abc import ABC, abstractmethod
import asyncio
import inspect
from dataclasses import dataclass
from enum import Enum


T = TypeVar('T')


class Scope(Enum):
    """依賴範圍"""
    SINGLETON = "singleton"  # 單例
    TRANSIENT = "transient"  # 每次創建新實例
    SCOPED = "scoped"        # 範圍內單例


@dataclass
class ServiceDescriptor:
    """服務描述符"""
    service_type: Type
    implementation_type: Optional[Type] = None
    factory: Optional[Callable] = None
    instance: Optional[Any] = None
    scope: Scope = Scope.TRANSIENT
    
    def __post_init__(self):
        if not self.implementation_type and not self.factory and not self.instance:
            self.implementation_type = self.service_type


class DependencyInjectionContainer:
    """依賴注入容器"""
    
    def __init__(self):
        self._services: Dict[Type, ServiceDescriptor] = {}
        self._instances: Dict[Type, Any] = {}
        self._scoped_instances: Dict[str, Dict[Type, Any]] = {}
        self._current_scope: Optional[str] = None
    
    def register_singleton(self, service_type: Type[T], implementation: Union[Type[T], T, Callable[[], T]]) -> 'DependencyInjectionContainer':
        """註冊單例服務"""
        if inspect.isclass(implementation):
            descriptor = ServiceDescriptor(
                service_type=service_type,
                implementation_type=implementation,
                scope=Scope.SINGLETON
            )
        elif callable(implementation):
            descriptor = ServiceDescriptor(
                service_type=service_type,
                factory=implementation,
                scope=Scope.SINGLETON
            )
        else:
            descriptor = ServiceDescriptor(
                service_type=service_type,
                instance=implementation,
                scope=Scope.SINGLETON
            )
        
        self._services[service_type] = descriptor
        return self
    
    def register_transient(self, service_type: Type[T], implementation: Union[Type[T], Callable[[], T]]) -> 'DependencyInjectionContainer':
        """註冊瞬態服務"""
        if inspect.isclass(implementation):
            descriptor = ServiceDescriptor(
                service_type=service_type,
                implementation_type=implementation,
                scope=Scope.TRANSIENT
            )
        else:
            descriptor = ServiceDescriptor(
                service_type=service_type,
                factory=implementation,
                scope=Scope.TRANSIENT
            )
        
        self._services[service_type] = descriptor
        return self
    
    def register_scoped(self, service_type: Type[T], implementation: Union[Type[T], Callable[[], T]]) -> 'DependencyInjectionContainer':
        """註冊範圍服務"""
        if inspect.isclass(implementation):
            descriptor = ServiceDescriptor(
                service_type=service_type,
                implementation_type=implementation,
                scope=Scope.SCOPED
            )
        else:
            descriptor = ServiceDescriptor(
                service_type=service_type,
                factory=implementation,
                scope=Scope.SCOPED
            )
        
        self._services[service_type] = descriptor
        return self
    
    def get_service(self, service_type: Type[T]) -> T:
        """獲取服務實例"""
        if service_type not in self._services:
            service_name = getattr(service_type, '__name__', str(service_type))
            raise ValueError(f"Service {service_name} not registered")
        
        descriptor = self._services[service_type]
        
        # 處理已有實例
        if descriptor.instance is not None:
            return descriptor.instance
        
        # 處理單例
        if descriptor.scope == Scope.SINGLETON:
            if service_type in self._instances:
                return self._instances[service_type]
            
            instance = self._create_instance(descriptor)
            self._instances[service_type] = instance
            return instance
        
        # 處理範圍服務
        if descriptor.scope == Scope.SCOPED:
            if self._current_scope is None:
                raise ValueError("No active scope for scoped service")
            
            if self._current_scope not in self._scoped_instances:
                self._scoped_instances[self._current_scope] = {}
            
            scoped_cache = self._scoped_instances[self._current_scope]
            if service_type in scoped_cache:
                return scoped_cache[service_type]
            
            instance = self._create_instance(descriptor)
            scoped_cache[service_type] = instance
            return instance
        
        # 處理瞬態服務
        return self._create_instance(descriptor)
    
    def _create_instance(self, descriptor: ServiceDescriptor) -> Any:
        """創建服務實例"""
        if descriptor.factory:
            return descriptor.factory()
        
        if descriptor.implementation_type:
            # 檢查構造函數參數
            constructor = descriptor.implementation_type.__init__
            sig = inspect.signature(constructor)
            
            # 準備構造函數參數
            kwargs = {}
            for param_name, param in sig.parameters.items():
                if param_name == 'self':
                    continue
                
                if param.annotation != inspect.Parameter.empty:
                    # 嘗試解析依賴
                    try:
                        dependency = self.get_service(param.annotation)
                        kwargs[param_name] = dependency
                    except ValueError:
                        # 如果沒有註冊依賴且有預設值，使用預設值
                        if param.default != inspect.Parameter.empty:
                            kwargs[param_name] = param.default
                        else:
                            raise ValueError(f"Cannot resolve dependency {param.annotation.__name__} for {descriptor.implementation_type.__name__}")
            
            return descriptor.implementation_type(**kwargs)
        
        raise ValueError("No implementation or factory provided")
    
    def create_scope(self, scope_name: str = None) -> 'ServiceScope':
        """創建服務範圍"""
        if scope_name is None:
            import uuid
            scope_name = str(uuid.uuid4())
        
        return ServiceScope(self, scope_name)
    
    def _enter_scope(self, scope_name: str):
        """進入範圍"""
        self._current_scope = scope_name
    
    def _exit_scope(self, scope_name: str):
        """退出範圍"""
        if scope_name in self._scoped_instances:
            del self._scoped_instances[scope_name]
        
        # 只有當前範圍才重置，支持嵌套範圍
        if self._current_scope == scope_name:
            self._current_scope = None


class ServiceScope:
    """服務範圍上下文管理器"""
    
    def __init__(self, container: DependencyInjectionContainer, scope_name: str):
        self.container = container
        self.scope_name = scope_name
    
    def __enter__(self):
        self.container._enter_scope(self.scope_name)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.container._exit_scope(self.scope_name)


# 全局容器實例
_container: Optional[DependencyInjectionContainer] = None


def get_container() -> DependencyInjectionContainer:
    """獲取全局容器"""
    global _container
    if _container is None:
        _container = DependencyInjectionContainer()
    return _container


def configure_services() -> DependencyInjectionContainer:
    """配置服務依賴"""
    container = get_container()
    
    # 註冊配置服務
    from .config_service import get_config_service
    container.register_singleton(
        type(get_config_service()),
        get_config_service
    )
    
    # 註冊服務發現
    from .service_discovery import get_service_discovery
    container.register_singleton(
        type(get_service_discovery()),
        get_service_discovery
    )
    
    # 註冊負載均衡器
    from .load_balancer import get_load_balancer
    container.register_singleton(
        type(get_load_balancer()),
        get_load_balancer
    )
    
    # 註冊錯誤報告器工廠
    from .error_handler import get_error_reporter
    container.register_transient(
        type(get_error_reporter("default")),
        lambda: get_error_reporter("default")
    )
    
    return container


# 裝飾器支援
def inject(service_type: Type[T]) -> T:
    """依賴注入裝飾器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            container = get_container()
            service = container.get_service(service_type)
            return func(service, *args, **kwargs)
        return wrapper
    return decorator


class ServiceProvider:
    """服務提供者基類"""
    
    def __init__(self, container: DependencyInjectionContainer):
        self.container = container
    
    @abstractmethod
    def configure_services(self):
        """配置服務"""
        pass
