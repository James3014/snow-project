"""
Ski map service - visualize user's ski resort conquests.
"""
from typing import Dict, List
import uuid
import requests
import os

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.course_tracking import CourseVisit


def get_ski_map_data(db: Session, user_id: uuid.UUID) -> dict:
    """
    Get ski map data for a user showing visited and unvisited resorts.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Dictionary with ski map data including visited resorts and region statistics
    """
    # 1. Get visited resort IDs from course visits
    visited_resorts_query = db.query(CourseVisit.resort_id).filter(
        CourseVisit.user_id == user_id
    ).distinct()

    visited_resort_ids = [row[0] for row in visited_resorts_query.all()]

    # 2. Fetch all resorts from resort API
    all_resorts = _fetch_all_resorts()

    # 3. Calculate statistics by region
    region_stats = {}

    for resort in all_resorts:
        region = resort.get("region", "其他")  # Default to "其他" if no region

        if region not in region_stats:
            region_stats[region] = {
                "total": 0,
                "visited": 0,
                "resorts": []
            }

        is_visited = resort["id"] in visited_resort_ids

        region_stats[region]["total"] += 1
        if is_visited:
            region_stats[region]["visited"] += 1

        region_stats[region]["resorts"].append({
            "id": resort["id"],
            "name_zh": resort.get("name_zh"),
            "name_en": resort.get("name_en"),
            "visited": is_visited
        })

    # 4. Calculate completion percentages
    for region_data in region_stats.values():
        if region_data["total"] > 0:
            region_data["completion_percentage"] = round(
                (region_data["visited"] / region_data["total"]) * 100, 1
            )
        else:
            region_data["completion_percentage"] = 0.0

    # 5. Calculate overall statistics
    total_resorts = len(all_resorts)
    total_visited = len(visited_resort_ids)
    completion_percentage = round(
        (total_visited / total_resorts) * 100, 1
    ) if total_resorts > 0 else 0.0

    return {
        "user_id": user_id,
        "visited_resort_ids": visited_resort_ids,
        "total_resorts": total_resorts,
        "total_visited": total_visited,
        "completion_percentage": completion_percentage,
        "region_stats": region_stats
    }


def _fetch_all_resorts() -> List[dict]:
    """
    Fetch all resorts from the resort API service.

    Returns:
        List of resort dictionaries
    """
    # Get resort API URL from environment
    resort_api_url = os.getenv("RESORT_API_URL", "http://localhost:8000")

    try:
        response = requests.get(
            f"{resort_api_url}/resorts",
            params={"limit": 500},  # Get all resorts
            timeout=10
        )
        response.raise_for_status()

        data = response.json()

        # Handle both paginated and direct list responses
        if isinstance(data, dict) and "items" in data:
            return data["items"]
        elif isinstance(data, list):
            return data
        else:
            return []

    except requests.RequestException as e:
        print(f"Failed to fetch resorts from API: {e}")
        # Return empty list if API is unavailable
        return []


def get_region_detail(db: Session, user_id: uuid.UUID, region: str) -> dict:
    """
    Get detailed information for a specific region.

    Args:
        db: Database session
        user_id: User ID
        region: Region name

    Returns:
        Dictionary with region details
    """
    map_data = get_ski_map_data(db, user_id)

    region_data = map_data["region_stats"].get(region)

    if not region_data:
        raise ValueError(f"Region '{region}' not found")

    return {
        "region": region,
        **region_data
    }
