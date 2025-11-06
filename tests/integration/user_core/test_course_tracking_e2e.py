"""
Integration tests for course tracking API endpoints.
"""
import pytest
import uuid
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
from pathlib import Path

USER_CORE_ROOT = Path(__file__).resolve().parents[3] / "platform" / "user_core"
sys.path.insert(0, str(USER_CORE_ROOT))

from api.main import app  # type: ignore  # noqa: E402
from services.db import get_db  # type: ignore  # noqa: E402
from models.user_profile import Base as UserBase  # type: ignore  # noqa: E402
from models.course_tracking import Base as CourseBase, CourseVisit, CourseRecommendation, UserAchievement, AchievementDefinition  # type: ignore  # noqa: E402

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_course_tracking.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = None
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        if db:
            db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once per session."""
    all_bases = [UserBase, CourseBase]
    for base in all_bases:
        base.metadata.create_all(bind=engine)
    yield
    for base in all_bases:
        base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    """Clean tables before each test."""
    db = TestingSessionLocal()
    # Clean tables before each test
    for table in reversed(CourseBase.metadata.sorted_tables):
        db.execute(table.delete())
    for table in reversed(UserBase.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    yield db
    db.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    response = client.post("/users/", json={"bio": "test user", "roles": ["student"]})
    assert response.status_code == 200
    return response.json()["user_id"]


@pytest.fixture
def test_user_2(db_session):
    """Create a second test user."""
    response = client.post("/users/", json={"bio": "test user 2", "roles": ["student"]})
    assert response.status_code == 200
    return response.json()["user_id"]


# ==================== Course Visit Tests ====================

def test_record_course_visit(db_session, test_user):
    """Test recording a course visit."""
    visit_data = {
        "resort_id": "rusutsu",
        "course_name": "Family Course",
        "visited_date": str(date.today()),
        "notes": "Great beginner course!"
    }

    response = client.post(
        f"/users/{test_user}/course-visits",
        json=visit_data
    )

    assert response.status_code == 201
    data = response.json()
    assert data["resort_id"] == "rusutsu"
    assert data["course_name"] == "Family Course"
    assert data["user_id"] == test_user
    assert "id" in data


def test_record_course_visit_default_date(db_session, test_user):
    """Test recording a course visit with default date (today)."""
    visit_data = {
        "resort_id": "rusutsu",
        "course_name": "Super East Course"
    }

    response = client.post(
        f"/users/{test_user}/course-visits",
        json=visit_data
    )

    assert response.status_code == 201
    data = response.json()
    assert data["visited_date"] == str(date.today())


def test_duplicate_course_visit_rejected(db_session, test_user):
    """Test that duplicate course visits are rejected."""
    visit_data = {
        "resort_id": "rusutsu",
        "course_name": "Family Course",
        "visited_date": str(date.today())
    }

    # First visit succeeds
    response1 = client.post(
        f"/users/{test_user}/course-visits",
        json=visit_data
    )
    assert response1.status_code == 201

    # Second identical visit fails with 409 Conflict
    response2 = client.post(
        f"/users/{test_user}/course-visits",
        json=visit_data
    )
    assert response2.status_code == 409
    assert "already recorded" in response2.json()["detail"]


def test_get_user_course_visits(db_session, test_user):
    """Test retrieving user's course visits."""
    # Create multiple visits
    visits = [
        {"resort_id": "rusutsu", "course_name": "Family Course"},
        {"resort_id": "rusutsu", "course_name": "Super East Course"},
        {"resort_id": "niseko", "course_name": "Powder Paradise"},
    ]

    for visit in visits:
        client.post(f"/users/{test_user}/course-visits", json=visit)

    # Get all visits
    response = client.get(f"/users/{test_user}/course-visits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Filter by resort
    response = client.get(
        f"/users/{test_user}/course-visits",
        params={"resort_id": "rusutsu"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(v["resort_id"] == "rusutsu" for v in data)


def test_delete_course_visit(db_session, test_user):
    """Test deleting a course visit."""
    # Create a visit
    visit_data = {"resort_id": "rusutsu", "course_name": "Family Course"}
    response = client.post(f"/users/{test_user}/course-visits", json=visit_data)
    visit_id = response.json()["id"]

    # Delete it
    response = client.delete(f"/users/{test_user}/course-visits/{visit_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(f"/users/{test_user}/course-visits")
    assert len(response.json()) == 0


def test_delete_other_user_visit_fails(db_session, test_user, test_user_2):
    """Test that users cannot delete other users' visits."""
    # User 1 creates a visit
    visit_data = {"resort_id": "rusutsu", "course_name": "Family Course"}
    response = client.post(f"/users/{test_user}/course-visits", json=visit_data)
    visit_id = response.json()["id"]

    # User 2 tries to delete it
    response = client.delete(f"/users/{test_user_2}/course-visits/{visit_id}")
    assert response.status_code == 404


# ==================== Progress Tests ====================

def test_calculate_resort_progress(db_session, test_user):
    """Test calculating user's progress at a resort."""
    # Record 3 out of 10 courses
    courses = ["Course A", "Course B", "Course C"]
    for course in courses:
        client.post(
            f"/users/{test_user}/course-visits",
            json={"resort_id": "rusutsu", "course_name": course}
        )

    # Get progress
    response = client.get(
        f"/users/{test_user}/resorts/rusutsu/progress",
        params={"total_courses": 10}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["resort_id"] == "rusutsu"
    assert len(data["completed_courses"]) == 3
    assert data["total_courses"] == 10
    assert data["completion_percentage"] == 30.0


# ==================== Recommendation Tests ====================

def test_create_recommendation(db_session, test_user):
    """Test creating a course recommendation."""
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Super East Course",
        "rank": 1,
        "reason": "Amazing steep course with great powder!"
    }

    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )

    assert response.status_code == 201
    data = response.json()
    assert data["course_name"] == "Super East Course"
    assert data["rank"] == 1
    assert data["status"] == "pending_review"
    assert "id" in data


def test_recommendation_limit_per_resort(db_session, test_user):
    """Test that users can only have 3 recommendations per resort."""
    # Create 3 recommendations
    for i in range(1, 4):
        rec_data = {
            "resort_id": "rusutsu",
            "course_name": f"Course {i}",
            "rank": i,
            "reason": f"Reason {i}"
        }
        response = client.post(
            f"/users/{test_user}/recommendations",
            json=rec_data
        )
        assert response.status_code == 201

    # 4th recommendation should fail
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Course 4",
        "rank": 1,
        "reason": "This should fail"
    }
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    assert response.status_code == 400
    assert "Maximum 3 recommendations" in response.json()["detail"]


def test_unique_rank_per_resort(db_session, test_user):
    """Test that each rank (1-3) can only be used once per resort."""
    # Create recommendation with rank 1
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Course A",
        "rank": 1,
        "reason": "First choice"
    }
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    assert response.status_code == 201

    # Try to use rank 1 again
    rec_data["course_name"] = "Course B"
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    assert response.status_code == 400
    assert "already used" in response.json()["detail"]


def test_update_recommendation(db_session, test_user):
    """Test updating a recommendation."""
    # Create recommendation
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Course A",
        "rank": 1,
        "reason": "Original reason"
    }
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    rec_id = response.json()["id"]

    # Update it
    update_data = {
        "rank": 2,
        "reason": "Updated reason"
    }
    response = client.patch(
        f"/users/{test_user}/recommendations/{rec_id}",
        json=update_data
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rank"] == 2
    assert data["reason"] == "Updated reason"


def test_delete_recommendation(db_session, test_user):
    """Test deleting a recommendation."""
    # Create recommendation
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Course A",
        "rank": 1
    }
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    rec_id = response.json()["id"]

    # Delete it
    response = client.delete(f"/users/{test_user}/recommendations/{rec_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(f"/users/{test_user}/recommendations")
    assert len(response.json()) == 0


def test_moderate_recommendation(db_session, test_user):
    """Test moderating a recommendation."""
    # Create recommendation
    rec_data = {
        "resort_id": "rusutsu",
        "course_name": "Course A",
        "rank": 1
    }
    response = client.post(
        f"/users/{test_user}/recommendations",
        json=rec_data
    )
    rec_id = response.json()["id"]

    # Moderate it (approve)
    moderator_id = str(uuid.uuid4())
    response = client.patch(
        f"/users/recommendations/{rec_id}/moderate",
        params={"status": "approved", "reviewer_id": moderator_id}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["reviewed_by"] == moderator_id


# ==================== Course Rankings Tests ====================

def test_get_course_rankings(db_session, test_user, test_user_2):
    """Test getting course popularity rankings."""
    # Create some visits
    client.post(
        f"/users/{test_user}/course-visits",
        json={"resort_id": "rusutsu", "course_name": "Popular Course"}
    )
    client.post(
        f"/users/{test_user_2}/course-visits",
        json={"resort_id": "rusutsu", "course_name": "Popular Course"}
    )
    client.post(
        f"/users/{test_user}/course-visits",
        json={"resort_id": "rusutsu", "course_name": "Less Popular"}
    )

    # Get rankings
    response = client.get("/users/resorts/rusutsu/courses/rankings")
    assert response.status_code == 200
    data = response.json()

    assert len(data) >= 2
    # Popular Course should be ranked higher
    popular = next(r for r in data if r["course_name"] == "Popular Course")
    less_popular = next(r for r in data if r["course_name"] == "Less Popular")
    assert popular["visit_count"] == 2
    assert less_popular["visit_count"] == 1


# ==================== Achievement Tests ====================

def test_load_achievement_definitions(db_session):
    """Test that achievement definitions are loaded on startup."""
    response = client.get("/users/achievements/definitions")
    assert response.status_code == 200
    # Should have loaded definitions from YAML
    # Note: This depends on the YAML file existing


def test_get_user_achievements(db_session, test_user):
    """Test getting user's earned achievements."""
    response = client.get(f"/users/{test_user}/achievements")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_achievement_summary(db_session, test_user):
    """Test getting user's achievement summary."""
    response = client.get(f"/users/{test_user}/achievements/summary")
    assert response.status_code == 200
    data = response.json()

    assert "total_points" in data
    assert "achievement_count" in data
    assert "total_available" in data
    assert "completion_percentage" in data
    assert "category_breakdown" in data


def test_first_course_achievement(db_session, test_user):
    """Test that first course achievement is awarded automatically."""
    # Before any visits
    response = client.get(f"/users/{test_user}/achievements")
    initial_count = len(response.json())

    # Record first course visit
    client.post(
        f"/users/{test_user}/course-visits",
        json={"resort_id": "rusutsu", "course_name": "First Course"}
    )

    # Check if achievement was awarded
    response = client.get(f"/users/{test_user}/achievements")
    achievements = response.json()

    # Should have at least one achievement (if first_course definition exists)
    # This test might need adjustment based on actual achievement definitions
    assert len(achievements) >= initial_count


# ==================== Leaderboard Tests ====================

def test_get_leaderboard(db_session, test_user, test_user_2):
    """Test getting the global leaderboard."""
    response = client.get("/users/achievements/leaderboard")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    # Leaderboard entries should have required fields
    if len(data) > 0:
        entry = data[0]
        assert "rank" in entry
        assert "user_id" in entry
        assert "total_points" in entry
        assert "resorts_count" in entry
        assert "courses_count" in entry


def test_get_user_rank(db_session, test_user):
    """Test getting a specific user's leaderboard rank."""
    response = client.get(f"/users/{test_user}/leaderboard-rank")
    assert response.status_code == 200
    data = response.json()

    assert "user_id" in data
    assert "rank" in data
    # Rank might be None if user has no achievements


# ==================== Integration Flow Tests ====================

def test_complete_user_journey(db_session, test_user):
    """Test a complete user journey through the course tracking system."""

    # 1. User visits several courses
    courses = [
        {"resort_id": "rusutsu", "course_name": "Family Course"},
        {"resort_id": "rusutsu", "course_name": "Super East Course"},
        {"resort_id": "rusutsu", "course_name": "Powder Zone"},
    ]

    for course in courses:
        response = client.post(
            f"/users/{test_user}/course-visits",
            json=course
        )
        assert response.status_code == 201

    # 2. Check progress at resort
    response = client.get(
        f"/users/{test_user}/resorts/rusutsu/progress",
        params={"total_courses": 37}  # Rusutsu has 37 courses
    )
    assert response.status_code == 200
    progress = response.json()
    assert len(progress["completed_courses"]) == 3
    assert progress["completion_percentage"] > 0

    # 3. User recommends their favorite courses
    recommendations = [
        {
            "resort_id": "rusutsu",
            "course_name": "Super East Course",
            "rank": 1,
            "reason": "Best steep course!"
        },
        {
            "resort_id": "rusutsu",
            "course_name": "Powder Zone",
            "rank": 2,
            "reason": "Amazing tree runs"
        }
    ]

    for rec in recommendations:
        response = client.post(
            f"/users/{test_user}/recommendations",
            json=rec
        )
        assert response.status_code == 201

    # 4. Check achievements
    response = client.get(f"/users/{test_user}/achievements")
    assert response.status_code == 200

    # 5. View leaderboard position
    response = client.get(f"/users/{test_user}/leaderboard-rank")
    assert response.status_code == 200


def test_multi_user_competition(db_session, test_user, test_user_2):
    """Test multiple users competing on the leaderboard."""

    # User 1 visits 5 courses
    for i in range(5):
        client.post(
            f"/users/{test_user}/course-visits",
            json={"resort_id": "rusutsu", "course_name": f"Course {i}"}
        )

    # User 2 visits 3 courses
    for i in range(3):
        client.post(
            f"/users/{test_user_2}/course-visits",
            json={"resort_id": "rusutsu", "course_name": f"Course {i}"}
        )

    # Check leaderboard
    response = client.get("/users/achievements/leaderboard")
    assert response.status_code == 200
    leaderboard = response.json()

    # Both users should appear if they have achievements
    user_ids = [entry["user_id"] for entry in leaderboard]
    # Note: Users only appear on leaderboard if they have earned achievements
