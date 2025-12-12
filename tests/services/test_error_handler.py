"""
錯誤處理標準化測試
遵循 TDD 原則
"""
import pytest
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from services.shared.error_handler import (
    ErrorCode,
    ErrorLevel,
    ErrorDetail,
    ServiceError,
    ValidationError,
    NotFoundError,
    BusinessRuleError,
    StandardErrorHandler,
    ErrorReporter,
    get_error_reporter,
    handle_service_error
)


class TestServiceError:
    """ServiceError 測試"""
    
    def test_service_error_creation(self):
        """測試 ServiceError 創建"""
        error = ServiceError(
            code=ErrorCode.VALIDATION_ERROR,
            message="Test error",
            level=ErrorLevel.WARNING,
            context={"field": "email"}
        )
        
        assert error.code == ErrorCode.VALIDATION_ERROR
        assert str(error) == "Test error"
        assert error.level == ErrorLevel.WARNING
        assert error.context == {"field": "email"}
        assert isinstance(error.timestamp, datetime)
    
    def test_service_error_to_dict(self):
        """測試 ServiceError 轉換為字典"""
        error = ServiceError(
            code=ErrorCode.NOT_FOUND_ERROR,
            message="Resource not found"
        )
        
        error_dict = error.to_dict()
        
        assert error_dict["error"]["code"] == "E1004"
        assert error_dict["error"]["message"] == "Resource not found"
        assert error_dict["error"]["level"] == "error"
        assert "timestamp" in error_dict["error"]


class TestSpecificErrors:
    """特定錯誤類型測試"""
    
    def test_validation_error(self):
        """測試驗證錯誤"""
        error = ValidationError("Invalid email format", field="email")
        
        assert error.code == ErrorCode.VALIDATION_ERROR
        assert error.level == ErrorLevel.WARNING
        assert error.context["field"] == "email"
    
    def test_not_found_error(self):
        """測試資源未找到錯誤"""
        error = NotFoundError("User", "123")
        
        assert error.code == ErrorCode.NOT_FOUND_ERROR
        assert "User not found: 123" in str(error)
        assert error.context["resource"] == "User"
        assert error.context["identifier"] == "123"
    
    def test_not_found_error_without_identifier(self):
        """測試無標識符的資源未找到錯誤"""
        error = NotFoundError("User")
        
        assert "User not found" in str(error)
        assert error.context["resource"] == "User"
        assert error.context["identifier"] is None
    
    def test_business_rule_error(self):
        """測試業務規則錯誤"""
        error = BusinessRuleError("Cannot delete active user", rule="user_deletion")
        
        assert error.code == ErrorCode.BUSINESS_RULE_VIOLATION
        assert error.context["rule"] == "user_deletion"


class TestStandardErrorHandler:
    """StandardErrorHandler 測試"""
    
    def test_handle_service_error(self):
        """測試處理 ServiceError"""
        handler = StandardErrorHandler("test-service")
        
        original_error = ValidationError("Invalid input")
        error_detail = handler.handle_error(original_error)
        
        assert error_detail.code == ErrorCode.VALIDATION_ERROR
        assert error_detail.service == "test-service"
        assert error_detail.level == ErrorLevel.WARNING
    
    def test_handle_unknown_error(self):
        """測試處理未知錯誤"""
        handler = StandardErrorHandler("test-service")
        
        original_error = ValueError("Some value error")
        error_detail = handler.handle_error(original_error)
        
        assert error_detail.code == ErrorCode.UNKNOWN_ERROR
        assert error_detail.service == "test-service"
        assert error_detail.level == ErrorLevel.ERROR
        assert "Some value error" in error_detail.message
    
    def test_handle_error_with_context(self):
        """測試帶上下文的錯誤處理"""
        handler = StandardErrorHandler("test-service")
        
        error = ServiceError(ErrorCode.VALIDATION_ERROR, "Test error")
        context = {"user_id": "123", "action": "create_user"}
        
        error_detail = handler.handle_error(error, context)
        
        assert error_detail.context["user_id"] == "123"
        assert error_detail.context["action"] == "create_user"


class TestErrorReporter:
    """ErrorReporter 測試"""
    
    def test_report_error(self):
        """測試錯誤報告"""
        reporter = ErrorReporter("test-service")
        
        error = ValidationError("Invalid data")
        error_detail = reporter.report_error(
            error,
            user_id="user123",
            trace_id="trace456"
        )
        
        assert error_detail.user_id == "user123"
        assert error_detail.trace_id == "trace456"
        assert error_detail.service == "test-service"
    
    def test_create_error_response(self):
        """測試創建錯誤響應"""
        reporter = ErrorReporter("test-service")
        
        error_detail = ErrorDetail(
            code=ErrorCode.NOT_FOUND_ERROR,
            message="User not found",
            level=ErrorLevel.ERROR,
            timestamp=datetime.utcnow(),
            service="test-service"
        )
        
        response = reporter.create_error_response(error_detail)
        
        assert response["error"] == "E1004"
        assert response["message"] == "User not found"
        assert response["service"] == "test-service"
        assert "timestamp" in response


class TestGlobalErrorReporter:
    """全局錯誤報告器測試"""
    
    def test_get_error_reporter_singleton(self):
        """測試錯誤報告器單例"""
        reporter1 = get_error_reporter("test-service")
        reporter2 = get_error_reporter("test-service")
        
        assert reporter1 is reporter2
        assert reporter1.service_name == "test-service"
    
    def test_different_services_different_reporters(self):
        """測試不同服務有不同的報告器"""
        reporter1 = get_error_reporter("service-a")
        reporter2 = get_error_reporter("service-b")
        
        assert reporter1 is not reporter2
        assert reporter1.service_name == "service-a"
        assert reporter2.service_name == "service-b"


class TestErrorHandlerDecorator:
    """錯誤處理裝飾器測試"""
    
    def test_decorator_catches_service_error(self):
        """測試裝飾器捕獲 ServiceError"""
        @handle_service_error("test-service")
        def test_function():
            raise ValidationError("Invalid input")
        
        with pytest.raises(ValidationError):
            test_function()
    
    def test_decorator_converts_unknown_error(self):
        """測試裝飾器轉換未知錯誤"""
        @handle_service_error("test-service")
        def test_function():
            raise ValueError("Some error")
        
        with pytest.raises(ServiceError) as exc_info:
            test_function()
        
        assert exc_info.value.code == ErrorCode.UNKNOWN_ERROR
        assert "Some error" in str(exc_info.value)
    
    def test_decorator_returns_normal_result(self):
        """測試裝飾器正常返回結果"""
        @handle_service_error("test-service")
        def test_function():
            return "success"
        
        result = test_function()
        assert result == "success"


class TestErrorDetail:
    """ErrorDetail 測試"""
    
    def test_error_detail_creation(self):
        """測試 ErrorDetail 創建"""
        timestamp = datetime.utcnow()
        detail = ErrorDetail(
            code=ErrorCode.VALIDATION_ERROR,
            message="Test error",
            level=ErrorLevel.WARNING,
            timestamp=timestamp,
            service="test-service",
            context={"field": "email"}
        )
        
        assert detail.code == ErrorCode.VALIDATION_ERROR
        assert detail.message == "Test error"
        assert detail.level == ErrorLevel.WARNING
        assert detail.timestamp == timestamp
        assert detail.service == "test-service"
        assert detail.context == {"field": "email"}
    
    def test_error_detail_default_values(self):
        """測試 ErrorDetail 預設值"""
        detail = ErrorDetail(
            code=ErrorCode.UNKNOWN_ERROR,
            message="Test",
            level=ErrorLevel.ERROR,
            timestamp=datetime.utcnow(),
            service="test"
        )
        
        assert detail.context == {}
        assert detail.trace_id is None
        assert detail.user_id is None
