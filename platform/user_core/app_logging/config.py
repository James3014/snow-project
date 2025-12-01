"""Logging configuration."""
import logging
import sys
from typing import Optional
import uuid
from contextvars import ContextVar

# Context variable for request ID
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class RequestIdFilter(logging.Filter):
    """Add request ID to log records."""
    
    def filter(self, record):
        record.request_id = request_id_var.get() or '-'
        return True


def setup_logging(level: str = "INFO") -> None:
    """Configure application logging."""
    log_format = "%(asctime)s | %(levelname)-8s | %(request_id)s | %(name)s | %(message)s"
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(log_format))
    handler.addFilter(RequestIdFilter())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    root_logger.handlers = [handler]
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name."""
    return logging.getLogger(name)


def set_request_id(request_id: Optional[str] = None) -> str:
    """Set request ID for current context."""
    rid = request_id or str(uuid.uuid4())[:8]
    request_id_var.set(rid)
    return rid


def get_request_id() -> Optional[str]:
    """Get current request ID."""
    return request_id_var.get()
