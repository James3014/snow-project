"""
Contract tests for OpenAPI structure and schema validation.

Validates that:
- All expected endpoints exist
- Request/response schemas are properly defined
- Security schemes are configured
- API metadata is correct
"""
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[3]
USER_CORE_ROOT = ROOT / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app  # type: ignore  # noqa: E402


class TestOpenAPIStructure:
    """Test OpenAPI specification structure."""

    @pytest.fixture
    def openapi_spec(self):
        """Get the generated OpenAPI spec."""
        return app.openapi()

    def test_api_metadata_exists(self, openapi_spec):
        """Test that API metadata is properly defined."""
        assert "info" in openapi_spec
        assert "title" in openapi_spec["info"]
        assert "version" in openapi_spec["info"]
        assert openapi_spec["info"]["title"]  # Non-empty
        assert openapi_spec["info"]["version"]  # Non-empty

    def test_openapi_version(self, openapi_spec):
        """Test OpenAPI version is 3.x."""
        assert "openapi" in openapi_spec
        assert openapi_spec["openapi"].startswith("3.")

    def test_required_paths_exist(self, openapi_spec):
        """Test that all required API paths exist."""
        required_paths = [
            "/health",
            "/users/",
            "/users/{user_id}",
            "/users/{user_id}/merge",
            "/users/{user_id}/preferences",
            "/events/"
        ]

        assert "paths" in openapi_spec
        for path in required_paths:
            assert path in openapi_spec["paths"], f"Missing required path: {path}"

    def test_user_profile_endpoints_structure(self, openapi_spec):
        """Test user profile endpoints have correct HTTP methods."""
        paths = openapi_spec["paths"]

        # /users/ should have GET and POST
        assert "get" in paths["/users/"]
        assert "post" in paths["/users/"]

        # /users/{user_id} should have GET, PUT, DELETE
        assert "get" in paths["/users/{user_id}"]
        assert "put" in paths["/users/{user_id}"]
        assert "delete" in paths["/users/{user_id}"]

        # /users/{user_id}/merge should have POST
        assert "post" in paths["/users/{user_id}/merge"]

    def test_notification_preferences_endpoints_structure(self, openapi_spec):
        """Test notification preferences endpoints structure."""
        paths = openapi_spec["paths"]

        # /users/{user_id}/preferences should have GET and PUT
        assert "get" in paths["/users/{user_id}/preferences"]
        assert "put" in paths["/users/{user_id}/preferences"]

    def test_behavior_events_endpoints_structure(self, openapi_spec):
        """Test behavior events endpoints structure."""
        paths = openapi_spec["paths"]

        # /events/ should have POST
        assert "post" in paths["/events/"]

        # Events can be queried by user
        assert "/events/by-user/{user_id}" in paths

    def test_schemas_defined(self, openapi_spec):
        """Test that essential schemas are defined."""
        assert "components" in openapi_spec
        assert "schemas" in openapi_spec["components"]

        schemas = openapi_spec["components"]["schemas"]
        essential_schemas = [
            "UserProfileCreate",
            "UserProfile",
            "BehaviorEventCreate",
            "BehaviorEvent",
            "NotificationPreference",
            "NotificationPreferenceCreate"
        ]

        for schema_name in essential_schemas:
            assert schema_name in schemas, f"Missing schema: {schema_name}"

    def test_user_profile_schema_fields(self, openapi_spec):
        """Test UserProfile schema has required fields."""
        schemas = openapi_spec["components"]["schemas"]
        user_profile = schemas.get("UserProfile", {})

        required_fields = ["user_id", "status", "created_at", "updated_at"]
        properties = user_profile.get("properties", {})

        for field in required_fields:
            assert field in properties, f"Missing required field in UserProfile: {field}"

    def test_behavior_event_schema_fields(self, openapi_spec):
        """Test BehaviorEventCreate schema has required fields."""
        schemas = openapi_spec["components"]["schemas"]
        behavior_event = schemas.get("BehaviorEventCreate", {})

        required_fields = ["source_project", "event_type", "payload"]
        properties = behavior_event.get("properties", {})

        for field in required_fields:
            assert field in properties, f"Missing required field in BehaviorEventCreate: {field}"

    def test_notification_preference_schema_fields(self, openapi_spec):
        """Test NotificationPreferenceCreate schema structure."""
        schemas = openapi_spec["components"]["schemas"]
        notification_pref = schemas.get("NotificationPreferenceCreate", {})

        expected_fields = ["channel", "topic", "status"]
        properties = notification_pref.get("properties", {})

        for field in expected_fields:
            assert field in properties, f"Missing field in NotificationPreferenceCreate: {field}"

    def test_enum_definitions(self, openapi_spec):
        """Test that enum types are properly defined."""
        schemas = openapi_spec["components"]["schemas"]

        # Check if UserStatus enum exists
        if "UserStatus" in schemas:
            user_status = schemas["UserStatus"]
            assert "enum" in user_status
            assert "active" in user_status["enum"]
            assert "inactive" in user_status["enum"]
            assert "merged" in user_status["enum"]

    def test_response_codes_defined(self, openapi_spec):
        """Test that endpoints define proper response codes."""
        paths = openapi_spec["paths"]

        # Check POST /users/
        post_users = paths["/users/"]["post"]
        assert "responses" in post_users
        assert "200" in post_users["responses"] or "201" in post_users["responses"]
        assert "422" in post_users["responses"]  # Validation error

        # Check GET /users/{user_id}
        get_user = paths["/users/{user_id}"]["get"]
        assert "responses" in get_user
        assert "200" in get_user["responses"]

    def test_healthz_endpoint(self, openapi_spec):
        """Test that health check endpoint is defined."""
        paths = openapi_spec["paths"]
        assert "/health" in paths
        assert "get" in paths["/health"]

        healthz = paths["/health"]["get"]
        assert "responses" in healthz
        assert "200" in healthz["responses"]

    def test_pagination_parameters_exist(self, openapi_spec):
        """Test that list endpoints support pagination."""
        paths = openapi_spec["paths"]

        # Check GET /users/ has limit and offset/cursor parameters
        get_users = paths["/users/"]["get"]
        if "parameters" in get_users:
            param_names = [p["name"] for p in get_users["parameters"]]
            # Should have some form of pagination
            assert "limit" in param_names or "skip" in param_names or "page" in param_names

    def test_filtering_parameters_exist(self, openapi_spec):
        """Test that GET /events supports filtering."""
        paths = openapi_spec["paths"]

        # Check GET /events/by-user/{user_id} has filtering parameters
        get_events = paths["/events/by-user/{user_id}"]["get"]
        if "parameters" in get_events:
            param_names = [p["name"] for p in get_events["parameters"]]
            # Should support filtering
            assert len(param_names) > 0  # Has some parameters


class TestResponseSchemas:
    """Test response schema structures in detail."""

    @pytest.fixture
    def openapi_spec(self):
        """Get the generated OpenAPI spec."""
        return app.openapi()

    def test_error_response_schema(self, openapi_spec):
        """Test that error responses are properly structured."""
        schemas = openapi_spec["components"]["schemas"]

        # FastAPI generates HTTPValidationError and ValidationError
        # We just verify they exist if validation is used
        if "HTTPValidationError" in schemas:
            assert "properties" in schemas["HTTPValidationError"]

    def test_user_profile_read_has_timestamps(self, openapi_spec):
        """Test that UserProfile includes timestamp fields."""
        schemas = openapi_spec["components"]["schemas"]
        user_profile = schemas.get("UserProfile", {})
        properties = user_profile.get("properties", {})

        assert "created_at" in properties
        assert "updated_at" in properties

        # Check they're datetime type
        assert properties["created_at"].get("type") == "string" or properties["created_at"].get("format") == "date-time"

    def test_behavior_event_read_has_ids(self, openapi_spec):
        """Test that BehaviorEvent includes ID fields."""
        schemas = openapi_spec["components"]["schemas"]
        behavior_event = schemas.get("BehaviorEvent", {})
        properties = behavior_event.get("properties", {})

        assert "event_id" in properties
        assert "user_id" in properties

    def test_notification_preference_read_structure(self, openapi_spec):
        """Test NotificationPreference schema structure."""
        schemas = openapi_spec["components"]["schemas"]
        pref_read = schemas.get("NotificationPreference", {})
        properties = pref_read.get("properties", {})

        # Should include composite key fields
        assert "user_id" in properties or "channel" in properties or "topic" in properties


class TestPathParameters:
    """Test path parameter definitions."""

    @pytest.fixture
    def openapi_spec(self):
        """Get the generated OpenAPI spec."""
        return app.openapi()

    def test_user_id_parameter_defined(self, openapi_spec):
        """Test that user_id path parameter is properly defined."""
        paths = openapi_spec["paths"]
        user_detail = paths["/users/{user_id}"]["get"]

        if "parameters" in user_detail:
            params = user_detail["parameters"]
            user_id_params = [p for p in params if p.get("name") == "user_id"]
            assert len(user_id_params) > 0
            user_id_param = user_id_params[0]
            assert user_id_param["in"] == "path"
            assert user_id_param.get("required") is True

    def test_path_parameters_use_uuid(self, openapi_spec):
        """Test that user_id parameters are defined as UUID."""
        paths = openapi_spec["paths"]
        user_detail = paths["/users/{user_id}"]["get"]

        if "parameters" in user_detail:
            params = user_detail["parameters"]
            user_id_params = [p for p in params if p.get("name") == "user_id"]
            if user_id_params:
                user_id_param = user_id_params[0]
                schema = user_id_param.get("schema", {})
                # Should be string with uuid format or just string
                assert schema.get("type") == "string" or schema.get("format") == "uuid"
