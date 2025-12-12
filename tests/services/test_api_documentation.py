"""
API 文檔測試
"""
import pytest
import json
from services.shared.api_documentation import (
    ParameterLocation, HTTPMethod, APIParameter, APIResponse, APIEndpoint,
    APIDocumentationBuilder, create_standard_responses,
    create_user_service_docs, create_resort_service_docs
)


class TestAPIParameter:
    """API 參數測試"""
    
    def test_api_parameter_creation(self):
        """測試 API 參數創建"""
        param = APIParameter(
            name="user_id",
            location=ParameterLocation.PATH,
            description="用戶 ID",
            required=True,
            schema_type="integer",
            example=123
        )
        
        assert param.name == "user_id"
        assert param.location == ParameterLocation.PATH
        assert param.description == "用戶 ID"
        assert param.required is True
        assert param.schema_type == "integer"
        assert param.example == 123
    
    def test_api_parameter_to_openapi(self):
        """測試轉換為 OpenAPI 格式"""
        param = APIParameter(
            name="page",
            location=ParameterLocation.QUERY,
            description="頁碼",
            required=False,
            schema_type="integer",
            example=1
        )
        
        openapi_param = param.to_openapi()
        
        assert openapi_param["name"] == "page"
        assert openapi_param["in"] == "query"
        assert openapi_param["description"] == "頁碼"
        assert openapi_param["required"] is False
        assert openapi_param["schema"]["type"] == "integer"
        assert openapi_param["example"] == 1


class TestAPIResponse:
    """API 響應測試"""
    
    def test_api_response_creation(self):
        """測試 API 響應創建"""
        response = APIResponse(
            status_code=200,
            description="成功",
            content_type="application/json",
            example={"status": "success"}
        )
        
        assert response.status_code == 200
        assert response.description == "成功"
        assert response.content_type == "application/json"
        assert response.example == {"status": "success"}
    
    def test_api_response_to_openapi(self):
        """測試轉換為 OpenAPI 格式"""
        response = APIResponse(
            status_code=201,
            description="創建成功",
            example={"id": 1, "name": "test"}
        )
        
        openapi_response = response.to_openapi()
        
        assert openapi_response["description"] == "創建成功"
        assert "content" in openapi_response
        assert "application/json" in openapi_response["content"]
        assert openapi_response["content"]["application/json"]["example"] == {"id": 1, "name": "test"}
    
    def test_api_response_minimal(self):
        """測試最小響應"""
        response = APIResponse(
            status_code=404,
            description="未找到"
        )
        
        openapi_response = response.to_openapi()
        
        assert openapi_response["description"] == "未找到"
        assert "content" not in openapi_response


class TestAPIEndpoint:
    """API 端點測試"""
    
    def test_api_endpoint_creation(self):
        """測試 API 端點創建"""
        endpoint = APIEndpoint(
            path="/users/{id}",
            method=HTTPMethod.GET,
            summary="獲取用戶",
            description="根據 ID 獲取用戶信息",
            tags=["users"]
        )
        
        assert endpoint.path == "/users/{id}"
        assert endpoint.method == HTTPMethod.GET
        assert endpoint.summary == "獲取用戶"
        assert endpoint.description == "根據 ID 獲取用戶信息"
        assert endpoint.tags == ["users"]
        assert endpoint.parameters == []
        assert endpoint.responses == []
    
    def test_api_endpoint_with_parameters(self):
        """測試帶參數的端點"""
        param = APIParameter("id", ParameterLocation.PATH, "用戶 ID", True, "integer")
        response = APIResponse(200, "成功")
        
        endpoint = APIEndpoint(
            path="/users/{id}",
            method=HTTPMethod.GET,
            summary="獲取用戶",
            parameters=[param],
            responses=[response]
        )
        
        assert len(endpoint.parameters) == 1
        assert len(endpoint.responses) == 1
        assert endpoint.parameters[0] == param
        assert endpoint.responses[0] == response
    
    def test_api_endpoint_to_openapi(self):
        """測試轉換為 OpenAPI 格式"""
        param = APIParameter("id", ParameterLocation.PATH, "用戶 ID", True, "integer")
        response = APIResponse(200, "成功", example={"id": 1})
        
        endpoint = APIEndpoint(
            path="/users/{id}",
            method=HTTPMethod.GET,
            summary="獲取用戶",
            description="根據 ID 獲取用戶詳情",
            tags=["users"],
            parameters=[param],
            responses=[response]
        )
        
        openapi_operation = endpoint.to_openapi()
        
        assert openapi_operation["summary"] == "獲取用戶"
        assert openapi_operation["description"] == "根據 ID 獲取用戶詳情"
        assert openapi_operation["tags"] == ["users"]
        assert len(openapi_operation["parameters"]) == 1
        assert "200" in openapi_operation["responses"]


class TestAPIDocumentationBuilder:
    """API 文檔構建器測試"""
    
    @pytest.fixture
    def builder(self):
        return APIDocumentationBuilder(
            title="Test API",
            version="1.0.0",
            description="測試 API"
        )
    
    def test_builder_initialization(self, builder):
        """測試構建器初始化"""
        spec = builder.build()
        
        assert spec["openapi"] == "3.0.3"
        assert spec["info"]["title"] == "Test API"
        assert spec["info"]["version"] == "1.0.0"
        assert spec["info"]["description"] == "測試 API"
        assert spec["paths"] == {}
        assert "schemas" in spec["components"]
        assert "securitySchemes" in spec["components"]
    
    def test_add_server(self, builder):
        """測試添加服務器"""
        builder.add_server("http://localhost:8000", "開發服務器")
        
        spec = builder.build()
        assert "servers" in spec
        assert len(spec["servers"]) == 1
        assert spec["servers"][0]["url"] == "http://localhost:8000"
        assert spec["servers"][0]["description"] == "開發服務器"
    
    def test_add_tag(self, builder):
        """測試添加標籤"""
        builder.add_tag("users", "用戶管理")
        
        spec = builder.build()
        assert len(spec["tags"]) == 1
        assert spec["tags"][0]["name"] == "users"
        assert spec["tags"][0]["description"] == "用戶管理"
    
    def test_add_schema(self, builder):
        """測試添加模式"""
        user_schema = {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "name": {"type": "string"}
            }
        }
        
        builder.add_schema("User", user_schema)
        
        spec = builder.build()
        assert "User" in spec["components"]["schemas"]
        assert spec["components"]["schemas"]["User"] == user_schema
    
    def test_add_security_scheme(self, builder):
        """測試添加安全方案"""
        bearer_auth = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
        
        builder.add_security_scheme("bearerAuth", bearer_auth)
        
        spec = builder.build()
        assert "bearerAuth" in spec["components"]["securitySchemes"]
        assert spec["components"]["securitySchemes"]["bearerAuth"] == bearer_auth
    
    def test_add_endpoint(self, builder):
        """測試添加端點"""
        endpoint = APIEndpoint(
            path="/users",
            method=HTTPMethod.GET,
            summary="獲取用戶列表",
            tags=["users"]
        )
        
        builder.add_endpoint(endpoint)
        
        spec = builder.build()
        assert "/users" in spec["paths"]
        assert "get" in spec["paths"]["/users"]
        assert spec["paths"]["/users"]["get"]["summary"] == "獲取用戶列表"
    
    def test_to_json(self, builder):
        """測試轉換為 JSON"""
        json_str = builder.to_json()
        
        # 驗證是有效的 JSON
        parsed = json.loads(json_str)
        assert parsed["info"]["title"] == "Test API"
    
    def test_to_yaml(self, builder):
        """測試轉換為 YAML"""
        try:
            yaml_str = builder.to_yaml()
            
            # 基本驗證 YAML 格式
            assert "openapi: 3.0.3" in yaml_str
            assert "title: Test API" in yaml_str
        except ImportError:
            # 如果沒有安裝 PyYAML，跳過測試
            pytest.skip("PyYAML not installed")


class TestStandardResponses:
    """標準響應測試"""
    
    def test_create_standard_responses(self):
        """測試創建標準響應"""
        responses = create_standard_responses()
        
        assert len(responses) == 6
        
        # 檢查狀態碼
        status_codes = [resp.status_code for resp in responses]
        expected_codes = [200, 400, 401, 403, 404, 500]
        assert status_codes == expected_codes
        
        # 檢查每個響應都有描述和示例
        for response in responses:
            assert response.description != ""
            assert response.example is not None


class TestServiceDocumentation:
    """服務文檔測試"""
    
    def test_create_user_service_docs(self):
        """測試創建用戶服務文檔"""
        builder = create_user_service_docs()
        spec = builder.build()
        
        # 檢查基本信息
        assert spec["info"]["title"] == "User Service API"
        assert spec["info"]["version"] == "1.0.0"
        
        # 檢查服務器
        assert len(spec["servers"]) == 2
        
        # 檢查標籤
        tag_names = [tag["name"] for tag in spec["tags"]]
        assert "users" in tag_names
        assert "auth" in tag_names
        
        # 檢查模式
        assert "User" in spec["components"]["schemas"]
        assert "CreateUserRequest" in spec["components"]["schemas"]
        
        # 檢查安全方案
        assert "bearerAuth" in spec["components"]["securitySchemes"]
        
        # 檢查端點
        assert "/users" in spec["paths"]
        assert "/users/{id}" in spec["paths"]
        assert "get" in spec["paths"]["/users"]
        assert "post" in spec["paths"]["/users"]
        assert "get" in spec["paths"]["/users/{id}"]
    
    def test_create_resort_service_docs(self):
        """測試創建雪場服務文檔"""
        builder = create_resort_service_docs()
        spec = builder.build()
        
        # 檢查基本信息
        assert spec["info"]["title"] == "Resort Service API"
        
        # 檢查模式
        assert "Resort" in spec["components"]["schemas"]
        
        # 檢查端點
        assert "/resorts" in spec["paths"]
        assert "get" in spec["paths"]["/resorts"]
    
    def test_user_service_docs_completeness(self):
        """測試用戶服務文檔完整性"""
        builder = create_user_service_docs()
        spec = builder.build()
        
        # 檢查 GET /users 端點
        get_users = spec["paths"]["/users"]["get"]
        assert get_users["summary"] == "獲取用戶列表"
        assert len(get_users["parameters"]) == 3  # page, limit, search
        assert len(get_users["responses"]) == 6  # 200 + 5 標準錯誤響應
        
        # 檢查 POST /users 端點
        post_users = spec["paths"]["/users"]["post"]
        assert post_users["summary"] == "創建用戶"
        assert "requestBody" in post_users
        assert post_users["requestBody"]["required"] is True
        
        # 檢查 GET /users/{id} 端點
        get_user = spec["paths"]["/users/{id}"]["get"]
        assert get_user["summary"] == "獲取用戶詳情"
        assert len(get_user["parameters"]) == 1  # id parameter
        assert get_user["parameters"][0]["name"] == "id"
        assert get_user["parameters"][0]["in"] == "path"
        assert get_user["parameters"][0]["required"] is True


if __name__ == "__main__":
    pytest.main([__file__])
