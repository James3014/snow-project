from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch, AsyncMock

from resort_api.app.main import app
from resort_api.app.db import get_resorts_db

client = TestClient(app)
resorts_db = get_resorts_db()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["status"] == "ok"
    assert isinstance(json_response["resort_count"], int)
    assert json_response["resort_count"] == len(resorts_db)

def test_get_resort_by_id_found():
    # Assuming 'hakuba_happo_one' is a valid ID from the loaded data
    resort_id = "hakuba_happo_one"
    response = client.get(f"/resorts/{resort_id}")
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["resort_id"] == resort_id
    assert json_response["names"]["en"] == "Hakuba Happo-one Ski Resort"

def test_get_resort_by_id_not_found():
    resort_id = "non_existent_resort"
    response = client.get(f"/resorts/{resort_id}")
    assert response.status_code == 404
    assert response.json() == {"detail": f"Resort with id '{resort_id}' not found."}

def test_list_resorts_default_pagination():
    """Tests the default pagination for the /resorts endpoint."""
    response = client.get("/resorts")
    assert response.status_code == 200
    json_response = response.json()
    
    assert "total" in json_response
    assert "limit" in json_response
    assert "offset" in json_response
    assert "items" in json_response
    
    assert json_response["limit"] == 20
    assert json_response["offset"] == 0
    assert json_response["total"] == len(resorts_db)
    assert isinstance(json_response["items"], list)
    assert len(json_response["items"]) <= 20

    if len(json_response["items"]) > 0:
        assert "resort_id" in json_response["items"][0]
        assert "names" in json_response["items"][0]

def test_list_resorts_custom_pagination():
    """Tests custom limit and offset for pagination."""
    response = client.get("/resorts?limit=5&offset=10")
    assert response.status_code == 200
    json_response = response.json()

    assert json_response["limit"] == 5
    assert json_response["offset"] == 10
    assert json_response["total"] == len(resorts_db)
    assert len(json_response["items"]) <= 5

def test_list_resorts_with_region_filter():
    # Assuming 'Nagano Prefecture' is a valid region in the test data
    region = "Nagano Prefecture"
    response = client.get(f"/resorts?region={region}")
    assert response.status_code == 200
    json_response = response.json()
    assert "items" in json_response
    
    # Check that all returned items match the region
    for item in json_response["items"]:
        assert item["region"] == region
    
    # Check that the total count reflects the filtered result
    expected_total = len([r for r in resorts_db.values() if r.region == region])
    assert json_response["total"] == expected_total

def test_list_resorts_with_query_filter():
    query = "Happo"
    response = client.get(f"/resorts?q={query}")
    assert response.status_code == 200
    json_response = response.json()
    assert "items" in json_response
    assert len(json_response["items"]) > 0
    
    # Verify that at least one item's name contains the query
    found = any(query.lower() in item["names"]["en"].lower() for item in json_response["items"] if item["names"]["en"])
    assert found, "Query filter did not return expected results."

def test_list_resorts_with_amenities_filter():
    """Tests filtering resorts by amenities."""
    # 'Onsen' is a more common amenity in the dataset
    amenity = "onsen"
    response = client.get(f"/resorts?amenities={amenity}")
    assert response.status_code == 200
    json_response = response.json()
    assert len(json_response["items"]) > 0

    # Verify that all returned items have the amenity
    for item in json_response["items"]:
        resort_id = item["resort_id"]
        full_resort = resorts_db.get(resort_id)
        assert full_resort is not None
        amenity_names = [a.lower() for a in full_resort.amenities]
        assert amenity.lower() in amenity_names


@pytest.mark.asyncio
async def test_create_ski_history_success():
    """Tests the ski history creation endpoint with a mocked successful response."""
    user_id = "test-user-123"
    history_data = {"resort_id": "hakuba_happo_one", "date": "2024-02-20"}

    # Mock the httpx.AsyncClient.post call
    with patch("resort_api.app.services.history_service.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_client.return_value.__aenter__.return_value = mock_instance
        mock_response = AsyncMock()
        mock_response.raise_for_status = AsyncMock()
        mock_instance.post.return_value = mock_response
        
        response = client.post(
            f"/users/{user_id}/ski-history",
            headers={"X-User-Id": user_id},
            json=history_data
        )

        assert response.status_code == 202

def test_get_share_card_success():
    """Tests the shareable card generation endpoint for a valid resort."""
    resort_id = "hakuba_happo_one"
    response = client.get(f"/resorts/{resort_id}/share-card")

    assert response.status_code == 200
    assert response.headers['content-type'] == 'image/png'
    assert len(response.content) > 0

def test_get_share_card_not_found():
    """Tests the shareable card generation for a non-existent resort."""
    resort_id = "non_existent_resort"
    response = client.get(f"/resorts/{resort_id}/share-card")
    assert response.status_code == 404
