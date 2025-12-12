"""
統一錯誤處理標準
標準化錯誤格式和處理流程
"""
import logging
import traceback
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union
from enum import Enum
from dataclasses import dataclass
from datetime import datetime


class ErrorLevel(Enum):
    """錯誤級別"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorCode(Enum):
    """標準錯誤代碼"""
    # 通用錯誤 (1000-1999)
    UNKNOWN_ERROR = "E1000"
    VALIDATION_ERROR = "E1001"
    AUTHENTICATION_ERROR = "E1002"
    AUTHORIZATION_ERROR = "E1003"
    NOT_FOUND_ERROR = "E1004"
    CONFLICT_ERROR = "E1005"
    
    # 業務邏輯錯誤 (2000-2999)
    BUSINESS_RULE_VIOLATION = "E2000"
    INVALID_OPERATION = "E2001"
    RESOURCE_LIMIT_EXCEEDED = "E2002"
    
    # 系統錯誤 (3000-3999)
    DATABASE_ERROR = "E3000"
    NETWORK_ERROR = "E3001"
    SERVICE_UNAVAILABLE = "E3002"
    TIMEOUT_ERROR = "E3003"


@dataclass
class ErrorDetail:
    """錯誤詳情"""
    code: ErrorCode
    message: str
    level: ErrorLevel
    timestamp: datetime
    service: str
    trace_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


class ServiceError(Exception):
    """統一服務錯誤基類"""
    
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        level: ErrorLevel = ErrorLevel.ERROR,
        context: Dict[str, Any] = None,
        cause: Exception = None
    ):
        super().__init__(message)
        self.code = code
        self.level = level
        self.context = context or {}
        self.cause = cause
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典格式"""
        return {
            "error": {
                "code": self.code.value,
                "message": str(self),
                "level": self.level.value,
                "timestamp": self.timestamp.isoformat(),
                "context": self.context,
            }
        }


class ValidationError(ServiceError):
    """驗證錯誤"""
    
    def __init__(self, message: str, field: str = None, context: Dict[str, Any] = None):
        context = context or {}
        if field:
            context["field"] = field
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            level=ErrorLevel.WARNING,
            context=context
        )


class NotFoundError(ServiceError):
    """資源未找到錯誤"""
    
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        
        super().__init__(
            code=ErrorCode.NOT_FOUND_ERROR,
            message=message,
            context={"resource": resource, "identifier": identifier}
        )


class BusinessRuleError(ServiceError):
    """業務規則錯誤"""
    
    def __init__(self, message: str, rule: str = None):
        context = {}
        if rule:
            context["rule"] = rule
            
        super().__init__(
            code=ErrorCode.BUSINESS_RULE_VIOLATION,
            message=message,
            context=context
        )


class ErrorHandlerInterface(ABC):
    """錯誤處理器介面"""
    
    @abstractmethod
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> ErrorDetail:
        """處理錯誤"""
        pass
    
    @abstractmethod
    def log_error(self, error_detail: ErrorDetail) -> None:
        """記錄錯誤"""
        pass


class StandardErrorHandler(ErrorHandlerInterface):
    """標準錯誤處理器"""
    
    def __init__(self, service_name: str, logger: logging.Logger = None):
        self.service_name = service_name
        self.logger = logger or logging.getLogger(service_name)
    
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> ErrorDetail:
        """處理錯誤並返回標準化錯誤詳情"""
        context = context or {}
        
        if isinstance(error, ServiceError):
            error_detail = ErrorDetail(
                code=error.code,
                message=str(error),
                level=error.level,
                timestamp=error.timestamp,
                service=self.service_name,
                context={**error.context, **context}
            )
        else:
            # 處理未知錯誤
            error_detail = ErrorDetail(
                code=ErrorCode.UNKNOWN_ERROR,
                message=str(error),
                level=ErrorLevel.ERROR,
                timestamp=datetime.utcnow(),
                service=self.service_name,
                context=context
            )
        
        self.log_error(error_detail)
        return error_detail
    
    def log_error(self, error_detail: ErrorDetail) -> None:
        """記錄錯誤到日誌"""
        log_data = {
            "service": error_detail.service,
            "error_code": error_detail.code.value,
            "error_message": error_detail.message,  # 改名避免衝突
            "level": error_detail.level.value,
            "timestamp": error_detail.timestamp.isoformat(),
            "context": error_detail.context,
        }
        
        if error_detail.trace_id:
            log_data["trace_id"] = error_detail.trace_id
        
        if error_detail.user_id:
            log_data["user_id"] = error_detail.user_id
        
        # 根據錯誤級別選擇日誌級別
        if error_detail.level == ErrorLevel.CRITICAL:
            self.logger.critical("Critical error occurred", extra=log_data)
        elif error_detail.level == ErrorLevel.ERROR:
            self.logger.error("Error occurred", extra=log_data)
        elif error_detail.level == ErrorLevel.WARNING:
            self.logger.warning("Warning occurred", extra=log_data)
        else:
            self.logger.info("Info event", extra=log_data)


class ErrorReporter:
    """錯誤報告器"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.error_handler = StandardErrorHandler(service_name)
    
    def report_error(
        self,
        error: Exception,
        user_id: str = None,
        trace_id: str = None,
        context: Dict[str, Any] = None
    ) -> ErrorDetail:
        """報告錯誤"""
        context = context or {}
        
        error_detail = self.error_handler.handle_error(error, context)
        error_detail.user_id = user_id
        error_detail.trace_id = trace_id
        
        return error_detail
    
    def create_error_response(self, error_detail: ErrorDetail) -> Dict[str, Any]:
        """創建標準錯誤響應"""
        return {
            "error": error_detail.code.value,
            "message": error_detail.message,
            "timestamp": error_detail.timestamp.isoformat(),
            "service": error_detail.service,
            "details": error_detail.context
        }


# 全局錯誤報告器
_error_reporters: Dict[str, ErrorReporter] = {}


def get_error_reporter(service_name: str) -> ErrorReporter:
    """獲取錯誤報告器"""
    if service_name not in _error_reporters:
        _error_reporters[service_name] = ErrorReporter(service_name)
    return _error_reporters[service_name]


def handle_service_error(service_name: str):
    """錯誤處理裝飾器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                reporter = get_error_reporter(service_name)
                error_detail = reporter.report_error(e)
                
                # 重新拋出 ServiceError，其他錯誤轉換為 ServiceError
                if isinstance(e, ServiceError):
                    raise e
                else:
                    raise ServiceError(
                        code=ErrorCode.UNKNOWN_ERROR,
                        message=str(e),
                        cause=e
                    )
        return wrapper
    return decorator
