"""
統一監控和可觀測性
"""
import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class MetricPoint:
    """指標點"""
    name: str
    value: float
    timestamp: float = None
    tags: Dict[str, str] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()
        if self.tags is None:
            self.tags = {}


class MetricsCollector:
    """指標收集器"""
    
    def __init__(self):
        self.metrics: Dict[str, MetricPoint] = {}
    
    def counter(self, name: str, value: float = 1, tags: Dict[str, str] = None):
        """計數器"""
        key = f"{name}:{json.dumps(tags or {}, sort_keys=True)}"
        if key in self.metrics:
            self.metrics[key].value += value
        else:
            self.metrics[key] = MetricPoint(name, value, tags=tags)
    
    def gauge(self, name: str, value: float, tags: Dict[str, str] = None):
        """儀表盤"""
        key = f"{name}:{json.dumps(tags or {}, sort_keys=True)}"
        self.metrics[key] = MetricPoint(name, value, tags=tags)
    
    def histogram(self, name: str, value: float, tags: Dict[str, str] = None):
        """直方圖（簡化實現）"""
        self.gauge(f"{name}_value", value, tags)
    
    def get_metrics(self) -> Dict[str, Any]:
        """獲取所有指標"""
        return {key: {
            "name": metric.name,
            "value": metric.value,
            "timestamp": metric.timestamp,
            "tags": metric.tags
        } for key, metric in self.metrics.items()}


class StructuredLogger:
    """結構化日誌"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
    
    def _log(self, level: str, message: str, **kwargs):
        """統一日誌格式"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "service": self.service_name,
            "message": message,
            **kwargs
        }
        print(json.dumps(log_entry))
    
    def info(self, message: str, **kwargs):
        self._log("INFO", message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log("ERROR", message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log("WARNING", message, **kwargs)


# 全局實例
_metrics_collector = MetricsCollector()
_logger: Optional[StructuredLogger] = None


def get_metrics_collector() -> MetricsCollector:
    return _metrics_collector


def get_logger(service_name: str = "unknown") -> StructuredLogger:
    global _logger
    if _logger is None:
        _logger = StructuredLogger(service_name)
    return _logger


def metrics_middleware():
    """指標中間件"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            collector = get_metrics_collector()
            
            try:
                result = func(*args, **kwargs)
                collector.counter("requests_total", tags={"status": "success"})
                return result
            except Exception as e:
                collector.counter("requests_total", tags={"status": "error"})
                raise
            finally:
                duration = time.time() - start_time
                collector.histogram("request_duration_seconds", duration)
        
        return wrapper
    return decorator
