"""
API 文檔統一格式 (OpenAPI 3.0)
標準化 API 文檔生成和管理
"""
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import json

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


class ParameterLocation(Enum):
    """參數位置"""
    QUERY = "query"
    PATH = "path"
    HEADER = "header"
    COOKIE = "cookie"


class HTTPMethod(Enum):
    """HTTP 方法"""
    GET = "get"
    POST = "post"
    PUT = "put"
    DELETE = "delete"
    PATCH = "patch"
    OPTIONS = "options"
    HEAD = "head"


@dataclass
class APIParameter:
    """API 參數"""
    name: str
    location: ParameterLocation
    description: str = ""
    required: bool = False
    schema_type: str = "string"
    example: Any = None
    
    def to_openapi(self) -> Dict[str, Any]:
        """轉換為 OpenAPI 格式"""
        param = {
            "name": self.name,
            "in": self.location.value,
            "description": self.description,
            "required": self.required,
            "schema": {"type": self.schema_type}
        }
        
        if self.example is not None:
            param["example"] = self.example
        
        return param


@dataclass
class APIResponse:
    """API 響應"""
    status_code: int
    description: str
    content_type: str = "application/json"
    schema: Optional[Dict[str, Any]] = None
    example: Any = None
    
    def to_openapi(self) -> Dict[str, Any]:
        """轉換為 OpenAPI 格式"""
        response = {
            "description": self.description
        }
        
        if self.schema or self.example:
            response["content"] = {
                self.content_type: {}
            }
            
            if self.schema:
                response["content"][self.content_type]["schema"] = self.schema
            
            if self.example:
                response["content"][self.content_type]["example"] = self.example
        
        return response


@dataclass
class APIEndpoint:
    """API 端點"""
    path: str
    method: HTTPMethod
    summary: str
    description: str = ""
    tags: List[str] = None
    parameters: List[APIParameter] = None
    request_body: Optional[Dict[str, Any]] = None
    responses: List[APIResponse] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.parameters is None:
            self.parameters = []
        if self.responses is None:
            self.responses = []
    
    def to_openapi(self) -> Dict[str, Any]:
        """轉換為 OpenAPI 格式"""
        operation = {
            "summary": self.summary,
            "description": self.description,
            "tags": self.tags
        }
        
        if self.parameters:
            operation["parameters"] = [param.to_openapi() for param in self.parameters]
        
        if self.request_body:
            operation["requestBody"] = self.request_body
        
        if self.responses:
            operation["responses"] = {
                str(resp.status_code): resp.to_openapi() 
                for resp in self.responses
            }
        
        return operation


class APIDocumentationBuilder:
    """API 文檔構建器"""
    
    def __init__(self, title: str, version: str, description: str = ""):
        self.spec = {
            "openapi": "3.0.3",
            "info": {
                "title": title,
                "version": version,
                "description": description
            },
            "paths": {},
            "components": {
                "schemas": {},
                "securitySchemes": {}
            },
            "tags": []
        }
        self.endpoints: List[APIEndpoint] = []
    
    def add_server(self, url: str, description: str = ""):
        """添加服務器"""
        if "servers" not in self.spec:
            self.spec["servers"] = []
        
        self.spec["servers"].append({
            "url": url,
            "description": description
        })
    
    def add_tag(self, name: str, description: str = ""):
        """添加標籤"""
        self.spec["tags"].append({
            "name": name,
            "description": description
        })
    
    def add_schema(self, name: str, schema: Dict[str, Any]):
        """添加模式定義"""
        self.spec["components"]["schemas"][name] = schema
    
    def add_security_scheme(self, name: str, scheme: Dict[str, Any]):
        """添加安全方案"""
        self.spec["components"]["securitySchemes"][name] = scheme
    
    def add_endpoint(self, endpoint: APIEndpoint):
        """添加端點"""
        self.endpoints.append(endpoint)
        
        # 更新 OpenAPI 規範
        if endpoint.path not in self.spec["paths"]:
            self.spec["paths"][endpoint.path] = {}
        
        self.spec["paths"][endpoint.path][endpoint.method.value] = endpoint.to_openapi()
    
    def build(self) -> Dict[str, Any]:
        """構建完整的 OpenAPI 規範"""
        return self.spec
    
    def to_json(self, indent: int = 2) -> str:
        """轉換為 JSON 格式"""
        return json.dumps(self.build(), indent=indent, ensure_ascii=False)
    
    def to_yaml(self) -> str:
        """轉換為 YAML 格式"""
        if not HAS_YAML:
            raise ImportError("PyYAML is required for YAML output. Install with: pip install PyYAML")
        return yaml.dump(self.build(), default_flow_style=False, allow_unicode=True)


def create_standard_responses() -> List[APIResponse]:
    """創建標準響應"""
    return [
        APIResponse(
            status_code=200,
            description="Success",
            example={"status": "success", "data": {}}
        ),
        APIResponse(
            status_code=400,
            description="Bad Request",
            example={"status": "error", "message": "Invalid request parameters"}
        ),
        APIResponse(
            status_code=401,
            description="Unauthorized",
            example={"status": "error", "message": "Authentication required"}
        ),
        APIResponse(
            status_code=403,
            description="Forbidden",
            example={"status": "error", "message": "Access denied"}
        ),
        APIResponse(
            status_code=404,
            description="Not Found",
            example={"status": "error", "message": "Resource not found"}
        ),
        APIResponse(
            status_code=500,
            description="Internal Server Error",
            example={"status": "error", "message": "Internal server error"}
        )
    ]


def create_user_service_docs() -> APIDocumentationBuilder:
    """創建用戶服務文檔示例"""
    builder = APIDocumentationBuilder(
        title="User Service API",
        version="1.0.0",
        description="用戶管理服務 API"
    )
    
    # 添加服務器
    builder.add_server("http://localhost:8001", "Development server")
    builder.add_server("https://api.snowtrace.com", "Production server")
    
    # 添加標籤
    builder.add_tag("users", "用戶管理")
    builder.add_tag("auth", "認證授權")
    
    # 添加安全方案
    builder.add_security_scheme("bearerAuth", {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    })
    
    # 添加模式定義
    builder.add_schema("User", {
        "type": "object",
        "properties": {
            "id": {"type": "integer", "example": 1},
            "email": {"type": "string", "format": "email", "example": "user@example.com"},
            "name": {"type": "string", "example": "John Doe"},
            "created_at": {"type": "string", "format": "date-time"}
        },
        "required": ["id", "email", "name"]
    })
    
    builder.add_schema("CreateUserRequest", {
        "type": "object",
        "properties": {
            "email": {"type": "string", "format": "email"},
            "name": {"type": "string", "minLength": 1, "maxLength": 100},
            "password": {"type": "string", "minLength": 8}
        },
        "required": ["email", "name", "password"]
    })
    
    # 添加端點
    # GET /users
    builder.add_endpoint(APIEndpoint(
        path="/users",
        method=HTTPMethod.GET,
        summary="獲取用戶列表",
        description="獲取系統中的用戶列表，支持分頁和篩選",
        tags=["users"],
        parameters=[
            APIParameter("page", ParameterLocation.QUERY, "頁碼", False, "integer", 1),
            APIParameter("limit", ParameterLocation.QUERY, "每頁數量", False, "integer", 10),
            APIParameter("search", ParameterLocation.QUERY, "搜索關鍵字", False, "string")
        ],
        responses=[
            APIResponse(200, "成功", example={
                "status": "success",
                "data": {
                    "users": [{"id": 1, "email": "user@example.com", "name": "John Doe"}],
                    "pagination": {"page": 1, "limit": 10, "total": 1}
                }
            })
        ] + create_standard_responses()[1:]
    ))
    
    # POST /users
    builder.add_endpoint(APIEndpoint(
        path="/users",
        method=HTTPMethod.POST,
        summary="創建用戶",
        description="創建新的用戶帳戶",
        tags=["users"],
        request_body={
            "required": True,
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/CreateUserRequest"}
                }
            }
        },
        responses=[
            APIResponse(201, "創建成功", example={
                "status": "success",
                "data": {"id": 1, "email": "user@example.com", "name": "John Doe"}
            })
        ] + create_standard_responses()[1:]
    ))
    
    # GET /users/{id}
    builder.add_endpoint(APIEndpoint(
        path="/users/{id}",
        method=HTTPMethod.GET,
        summary="獲取用戶詳情",
        description="根據用戶 ID 獲取用戶詳細信息",
        tags=["users"],
        parameters=[
            APIParameter("id", ParameterLocation.PATH, "用戶 ID", True, "integer", 1)
        ],
        responses=[
            APIResponse(200, "成功", example={
                "status": "success",
                "data": {"id": 1, "email": "user@example.com", "name": "John Doe"}
            })
        ] + create_standard_responses()[1:]
    ))
    
    return builder


def create_resort_service_docs() -> APIDocumentationBuilder:
    """創建雪場服務文檔示例"""
    builder = APIDocumentationBuilder(
        title="Resort Service API",
        version="1.0.0",
        description="雪場信息服務 API"
    )
    
    builder.add_server("http://localhost:8000", "Development server")
    builder.add_tag("resorts", "雪場管理")
    
    # 添加雪場模式
    builder.add_schema("Resort", {
        "type": "object",
        "properties": {
            "id": {"type": "integer", "example": 1},
            "name": {"type": "string", "example": "苗場滑雪場"},
            "name_en": {"type": "string", "example": "Naeba Ski Resort"},
            "region": {"type": "string", "example": "新潟縣"},
            "elevation": {"type": "integer", "example": 1789},
            "slopes": {"type": "integer", "example": 22},
            "lifts": {"type": "integer", "example": 13}
        }
    })
    
    # GET /resorts
    builder.add_endpoint(APIEndpoint(
        path="/resorts",
        method=HTTPMethod.GET,
        summary="獲取雪場列表",
        tags=["resorts"],
        parameters=[
            APIParameter("region", ParameterLocation.QUERY, "地區篩選", False, "string"),
            APIParameter("limit", ParameterLocation.QUERY, "數量限制", False, "integer", 10)
        ],
        responses=create_standard_responses()
    ))
    
    return builder


# 使用示例
def generate_api_docs():
    """生成 API 文檔示例"""
    # 用戶服務文檔
    user_docs = create_user_service_docs()
    
    # 雪場服務文檔
    resort_docs = create_resort_service_docs()
    
    return {
        "user_service": user_docs.build(),
        "resort_service": resort_docs.build()
    }


if __name__ == "__main__":
    # 生成示例文檔
    docs = generate_api_docs()
    
    # 輸出用戶服務文檔
    user_builder = create_user_service_docs()
    print("User Service OpenAPI Spec (YAML):")
    print(user_builder.to_yaml())
