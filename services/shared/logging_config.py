"""
統一日誌格式標準
標準化日誌輸出和結構化日誌
"""
import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum


class LogLevel(Enum):
    """日誌級別"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class StructuredFormatter(logging.Formatter):
    """結構化日誌格式器"""
    
    def __init__(self, service_name: str, environment: str = "development"):
        super().__init__()
        self.service_name = service_name
        self.environment = environment
    
    def format(self, record: logging.LogRecord) -> str:
        """格式化日誌記錄"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": self.service_name,
            "environment": self.environment,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # 添加額外的上下文資訊
        if hasattr(record, 'trace_id'):
            log_entry["trace_id"] = record.trace_id
        
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        
        # 添加異常資訊
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info)
            }
        
        # 添加額外的字段
        extra_fields = {}
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 
                          'msecs', 'relativeCreated', 'thread', 'threadName', 
                          'processName', 'process', 'getMessage', 'exc_info', 
                          'exc_text', 'stack_info']:
                extra_fields[key] = value
        
        if extra_fields:
            log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry, ensure_ascii=False)


class SimpleFormatter(logging.Formatter):
    """簡單日誌格式器（開發環境）"""
    
    def __init__(self, service_name: str):
        super().__init__()
        self.service_name = service_name
    
    def format(self, record: logging.LogRecord) -> str:
        """格式化日誌記錄"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        # 基本格式
        message = f"[{timestamp}] {record.levelname:8} [{self.service_name}] {record.getMessage()}"
        
        # 添加位置資訊
        if record.levelno >= logging.WARNING:
            message += f" ({record.filename}:{record.lineno})"
        
        # 添加異常資訊
        if record.exc_info:
            message += "\n" + self.formatException(record.exc_info)
        
        return message


def setup_logging(
    service_name: str,
    level: str = "INFO",
    environment: str = "development",
    log_file: Optional[str] = None
) -> logging.Logger:
    """設置統一日誌配置"""
    
    # 創建 logger
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # 清除現有的 handlers
    logger.handlers.clear()
    
    # 選擇格式器
    if environment == "production":
        formatter = StructuredFormatter(service_name, environment)
    else:
        formatter = SimpleFormatter(service_name)
    
    # 控制台輸出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件輸出（如果指定）
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


class LoggerAdapter(logging.LoggerAdapter):
    """日誌適配器，添加上下文資訊"""
    
    def __init__(self, logger: logging.Logger, extra: Dict[str, Any]):
        super().__init__(logger, extra)
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        """處理日誌消息，添加額外資訊"""
        kwargs["extra"] = {**self.extra, **kwargs.get("extra", {})}
        return msg, kwargs


def get_logger(
    service_name: str,
    trace_id: str = None,
    user_id: str = None,
    request_id: str = None
) -> logging.Logger:
    """獲取帶上下文的 logger"""
    base_logger = logging.getLogger(service_name)
    
    if any([trace_id, user_id, request_id]):
        extra = {}
        if trace_id:
            extra["trace_id"] = trace_id
        if user_id:
            extra["user_id"] = user_id
        if request_id:
            extra["request_id"] = request_id
        
        return LoggerAdapter(base_logger, extra)
    
    return base_logger


# 預定義的日誌消息模板
class LogMessages:
    """標準日誌消息模板"""
    
    # 服務生命週期
    SERVICE_STARTED = "Service started successfully"
    SERVICE_STOPPED = "Service stopped"
    SERVICE_HEALTH_CHECK = "Health check performed"
    
    # API 請求
    API_REQUEST_RECEIVED = "API request received"
    API_REQUEST_COMPLETED = "API request completed"
    API_REQUEST_FAILED = "API request failed"
    
    # 資料庫操作
    DB_QUERY_EXECUTED = "Database query executed"
    DB_TRANSACTION_STARTED = "Database transaction started"
    DB_TRANSACTION_COMMITTED = "Database transaction committed"
    DB_TRANSACTION_ROLLED_BACK = "Database transaction rolled back"
    
    # 外部服務調用
    EXTERNAL_SERVICE_CALL = "External service call made"
    EXTERNAL_SERVICE_SUCCESS = "External service call successful"
    EXTERNAL_SERVICE_FAILED = "External service call failed"
    
    # 業務邏輯
    BUSINESS_OPERATION_STARTED = "Business operation started"
    BUSINESS_OPERATION_COMPLETED = "Business operation completed"
    BUSINESS_RULE_VIOLATED = "Business rule violated"


def log_api_request(logger: logging.Logger, method: str, path: str, status_code: int, duration_ms: float):
    """記錄 API 請求"""
    logger.info(
        LogMessages.API_REQUEST_COMPLETED,
        extra={
            "http_method": method,
            "http_path": path,
            "http_status": status_code,
            "duration_ms": duration_ms,
        }
    )


def log_database_query(logger: logging.Logger, query: str, duration_ms: float, rows_affected: int = None):
    """記錄資料庫查詢"""
    extra = {
        "query": query[:200] + "..." if len(query) > 200 else query,  # 截斷長查詢
        "duration_ms": duration_ms,
    }
    
    if rows_affected is not None:
        extra["rows_affected"] = rows_affected
    
    logger.info(LogMessages.DB_QUERY_EXECUTED, extra=extra)


def log_external_service_call(
    logger: logging.Logger,
    service: str,
    endpoint: str,
    method: str,
    status_code: int,
    duration_ms: float
):
    """記錄外部服務調用"""
    logger.info(
        LogMessages.EXTERNAL_SERVICE_CALL,
        extra={
            "external_service": service,
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "duration_ms": duration_ms,
        }
    )
