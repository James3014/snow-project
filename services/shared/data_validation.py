"""
統一資料驗證系統
標準化資料驗證規則和錯誤處理
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass
import re
from datetime import datetime, date


@dataclass
class ValidationError:
    """驗證錯誤"""
    field: str
    message: str
    code: str
    value: Any = None


class ValidationResult:
    """驗證結果"""
    
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.is_valid = True
    
    def add_error(self, field: str, message: str, code: str, value: Any = None):
        """添加錯誤"""
        self.errors.append(ValidationError(field, message, code, value))
        self.is_valid = False
    
    def merge(self, other: 'ValidationResult'):
        """合併驗證結果"""
        self.errors.extend(other.errors)
        if not other.is_valid:
            self.is_valid = False


class Validator(ABC):
    """驗證器基類"""
    
    @abstractmethod
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        """驗證值"""
        pass


class RequiredValidator(Validator):
    """必填驗證器"""
    
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        result = ValidationResult()
        if value is None or value == "" or (isinstance(value, (list, dict)) and len(value) == 0):
            result.add_error(field_name, f"{field_name} is required", "REQUIRED", value)
        return result


class StringValidator(Validator):
    """字符串驗證器"""
    
    def __init__(self, min_length: int = 0, max_length: int = None, pattern: str = None):
        self.min_length = min_length
        self.max_length = max_length
        self.pattern = re.compile(pattern) if pattern else None
    
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        result = ValidationResult()
        
        if value is None:
            return result
        
        if not isinstance(value, str):
            result.add_error(field_name, f"{field_name} must be a string", "TYPE_ERROR", value)
            return result
        
        if len(value) < self.min_length:
            result.add_error(field_name, f"{field_name} must be at least {self.min_length} characters", "MIN_LENGTH", value)
        
        if self.max_length and len(value) > self.max_length:
            result.add_error(field_name, f"{field_name} must be at most {self.max_length} characters", "MAX_LENGTH", value)
        
        if self.pattern and not self.pattern.match(value):
            result.add_error(field_name, f"{field_name} format is invalid", "PATTERN_MISMATCH", value)
        
        return result


class EmailValidator(Validator):
    """郵箱驗證器"""
    
    def __init__(self):
        self.pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        result = ValidationResult()
        
        if value is None:
            return result
        
        if not isinstance(value, str):
            result.add_error(field_name, f"{field_name} must be a string", "TYPE_ERROR", value)
            return result
        
        if not self.pattern.match(value):
            result.add_error(field_name, f"{field_name} is not a valid email", "INVALID_EMAIL", value)
        
        return result


class NumberValidator(Validator):
    """數字驗證器"""
    
    def __init__(self, min_value: Union[int, float] = None, max_value: Union[int, float] = None):
        self.min_value = min_value
        self.max_value = max_value
    
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        result = ValidationResult()
        
        if value is None:
            return result
        
        if not isinstance(value, (int, float)):
            result.add_error(field_name, f"{field_name} must be a number", "TYPE_ERROR", value)
            return result
        
        if self.min_value is not None and value < self.min_value:
            result.add_error(field_name, f"{field_name} must be at least {self.min_value}", "MIN_VALUE", value)
        
        if self.max_value is not None and value > self.max_value:
            result.add_error(field_name, f"{field_name} must be at most {self.max_value}", "MAX_VALUE", value)
        
        return result


class DateValidator(Validator):
    """日期驗證器"""
    
    def __init__(self, min_date: date = None, max_date: date = None):
        self.min_date = min_date
        self.max_date = max_date
    
    def validate(self, value: Any, field_name: str = "") -> ValidationResult:
        result = ValidationResult()
        
        if value is None:
            return result
        
        # 支持字符串轉換
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(value.replace('Z', '+00:00')).date()
            except ValueError:
                result.add_error(field_name, f"{field_name} is not a valid date", "INVALID_DATE", value)
                return result
        
        if not isinstance(value, date):
            result.add_error(field_name, f"{field_name} must be a date", "TYPE_ERROR", value)
            return result
        
        if self.min_date and value < self.min_date:
            result.add_error(field_name, f"{field_name} must be after {self.min_date}", "MIN_DATE", value)
        
        if self.max_date and value > self.max_date:
            result.add_error(field_name, f"{field_name} must be before {self.max_date}", "MAX_DATE", value)
        
        return result


class SchemaValidator:
    """模式驗證器"""
    
    def __init__(self):
        self.fields: Dict[str, List[Validator]] = {}
    
    def add_field(self, field_name: str, validators: List[Validator]):
        """添加字段驗證器"""
        self.fields[field_name] = validators
    
    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        """驗證數據"""
        result = ValidationResult()
        
        for field_name, validators in self.fields.items():
            value = data.get(field_name)
            
            for validator in validators:
                field_result = validator.validate(value, field_name)
                result.merge(field_result)
        
        return result


# 預定義驗證器
def create_user_validator() -> SchemaValidator:
    """創建用戶驗證器"""
    validator = SchemaValidator()
    validator.add_field("email", [RequiredValidator(), EmailValidator()])
    validator.add_field("name", [RequiredValidator(), StringValidator(min_length=2, max_length=50)])
    validator.add_field("age", [NumberValidator(min_value=0, max_value=150)])
    return validator


def create_event_validator() -> SchemaValidator:
    """創建事件驗證器"""
    validator = SchemaValidator()
    validator.add_field("title", [RequiredValidator(), StringValidator(min_length=1, max_length=200)])
    validator.add_field("start_date", [RequiredValidator(), DateValidator()])
    validator.add_field("end_date", [RequiredValidator(), DateValidator()])
    return validator
