"""
Trip planning API endpoints.

Provides REST APIs for:
- Season management (CRUD + stats)
- Trip management (CRUD + batch + share + complete)
- Buddy matching (explore + recommendations + requests)
- Calendar views
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import date

from services import trip_planning_service, db
from schemas import trip_planning as tp_schemas
from models.enums import SeasonStatus, TripStatus

router = APIRouter()


# ==================== Season Endpoints ====================

@router.post(
    "/seasons",
    response_model=tp_schemas.Season,
    summary="Create a new season",
    status_code=201
)
def create_season(
    season: tp_schemas.SeasonCreate,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """
    Create a new ski season for planning trips.

    - **title**: Season name (e.g., "2024-2025 冬季")
    - **start_date**: Season start date
    - **end_date**: Season end date
    - **goal_trips**: Optional target number of trips
    """
    return trip_planning_service.create_season(
        db=db_session,
        user_id=user_id,
        season_data=season
    )


@router.get(
    "/seasons",
    response_model=List[tp_schemas.Season],
    summary="Get user's seasons"
)
def get_seasons(
    user_id: uuid.UUID = Query(..., description="User ID"),
    status: Optional[SeasonStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db_session: Session = Depends(db.get_db)
):
    """Get all seasons for a user."""
    return trip_planning_service.get_user_seasons(
        db=db_session,
        user_id=user_id,
        status=status,
        skip=skip,
        limit=limit
    )


@router.get(
    "/seasons/{season_id}",
    response_model=tp_schemas.Season,
    summary="Get a specific season"
)
def get_season(
    season_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Get details of a specific season."""
    try:
        return trip_planning_service.get_season(
            db=db_session,
            season_id=season_id,
            user_id=user_id
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.patch(
    "/seasons/{season_id}",
    response_model=tp_schemas.Season,
    summary="Update a season"
)
def update_season(
    season_id: uuid.UUID,
    updates: tp_schemas.SeasonUpdate,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Update season details."""
    try:
        return trip_planning_service.update_season(
            db=db_session,
            season_id=season_id,
            user_id=user_id,
            updates=updates
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete(
    "/seasons/{season_id}",
    status_code=204,
    summary="Delete a season"
)
def delete_season(
    season_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Delete a season and all its trips."""
    try:
        trip_planning_service.delete_season(
            db=db_session,
            season_id=season_id,
            user_id=user_id
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get(
    "/seasons/{season_id}/stats",
    summary="Get season statistics"
)
def get_season_stats(
    season_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Get statistics for a season."""
    try:
        return trip_planning_service.get_season_stats(
            db=db_session,
            season_id=season_id,
            user_id=user_id
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


# ==================== Trip Endpoints ====================

@router.post(
    "/trips",
    response_model=tp_schemas.Trip,
    summary="Create a new trip",
    status_code=201
)
def create_trip(
    trip: tp_schemas.TripCreate,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """
    Create a new trip within a season.

    - **season_id**: Season this trip belongs to
    - **resort_id**: Resort identifier
    - **start_date**: Trip start date
    - **end_date**: Trip end date
    """
    try:
        return trip_planning_service.create_trip(
            db=db_session,
            user_id=user_id,
            trip_data=trip
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post(
    "/trips/batch",
    response_model=List[tp_schemas.Trip],
    summary="Create multiple trips",
    status_code=201
)
def create_trips_batch(
    batch: tp_schemas.TripBatchCreate,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Create multiple trips at once."""
    try:
        return trip_planning_service.create_trips_batch(
            db=db_session,
            user_id=user_id,
            season_id=batch.season_id,
            trips_data=batch.trips
        )
    except trip_planning_service.SeasonNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get(
    "/trips",
    response_model=List[tp_schemas.Trip],
    summary="Get user's trips"
)
def get_trips(
    user_id: uuid.UUID = Query(..., description="User ID"),
    season_id: Optional[uuid.UUID] = Query(None, description="Filter by season"),
    status: Optional[TripStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db_session: Session = Depends(db.get_db)
):
    """Get all trips for a user."""
    return trip_planning_service.get_user_trips(
        db=db_session,
        user_id=user_id,
        season_id=season_id,
        status=status,
        skip=skip,
        limit=limit
    )


@router.get(
    "/trips/{trip_id}",
    response_model=tp_schemas.Trip,
    summary="Get a specific trip"
)
def get_trip(
    trip_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = Query(None, description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Get details of a specific trip."""
    try:
        return trip_planning_service.get_trip(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.patch(
    "/trips/{trip_id}",
    response_model=tp_schemas.Trip,
    summary="Update a trip"
)
def update_trip(
    trip_id: uuid.UUID,
    updates: tp_schemas.TripUpdate,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Update trip details."""
    try:
        return trip_planning_service.update_trip(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id,
            updates=updates
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.delete(
    "/trips/{trip_id}",
    status_code=204,
    summary="Delete a trip"
)
def delete_trip(
    trip_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Delete a trip."""
    try:
        trip_planning_service.delete_trip(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.post(
    "/trips/{trip_id}/complete",
    response_model=tp_schemas.Trip,
    summary="Mark trip as completed"
)
def complete_trip(
    trip_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    create_course_visit: bool = Query(True, description="Auto-create CourseVisit"),
    db_session: Session = Depends(db.get_db)
):
    """Mark a trip as completed and optionally create a CourseVisit."""
    try:
        trip, course_visit = trip_planning_service.complete_trip(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id,
            create_course_visit=create_course_visit
        )
        return trip
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


# ==================== Buddy Matching Endpoints ====================

@router.post(
    "/trips/{trip_id}/buddy-requests",
    response_model=tp_schemas.BuddyInfo,
    summary="Request to join trip as buddy",
    status_code=201
)
def request_to_join_trip(
    trip_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    request_message: Optional[str] = Query(None, description="Request message"),
    db_session: Session = Depends(db.get_db)
):
    """Request to join a trip as buddy."""
    try:
        return trip_planning_service.request_to_join_trip(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id,
            request_message=request_message
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.BuddyRequestError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.patch(
    "/trips/{trip_id}/buddy-requests/{buddy_id}",
    response_model=tp_schemas.BuddyInfo,
    summary="Respond to buddy request"
)
def respond_to_buddy_request(
    trip_id: uuid.UUID,
    buddy_id: uuid.UUID,
    response: tp_schemas.BuddyResponse,
    user_id: uuid.UUID = Query(..., description="User ID (trip owner)"),
    db_session: Session = Depends(db.get_db)
):
    """Accept or decline a buddy request."""
    try:
        return trip_planning_service.respond_to_buddy_request(
            db=db_session,
            trip_id=trip_id,
            buddy_id=buddy_id,
            owner_id=user_id,
            status=response.status,
            response_message=response.response_message
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except trip_planning_service.BuddyRequestError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get(
    "/trips/{trip_id}/buddies",
    response_model=List[tp_schemas.BuddyInfo],
    summary="Get trip buddies"
)
def get_trip_buddies(
    trip_id: uuid.UUID,
    db_session: Session = Depends(db.get_db)
):
    """Get all buddies for a trip."""
    return trip_planning_service.get_trip_buddies(
        db=db_session,
        trip_id=trip_id
    )


# ==================== Share Endpoints ====================

@router.get(
    "/trips/{trip_id}/share-link",
    response_model=tp_schemas.ShareLinkResponse,
    summary="Generate share link"
)
def generate_share_link(
    trip_id: uuid.UUID,
    user_id: uuid.UUID = Query(..., description="User ID"),
    db_session: Session = Depends(db.get_db)
):
    """Generate a shareable link for a trip."""
    try:
        share_token = trip_planning_service.generate_share_link(
            db=db_session,
            trip_id=trip_id,
            user_id=user_id
        )
        return tp_schemas.ShareLinkResponse(
            share_token=share_token,
            share_url=f"/trips/shared/{share_token}",
            expires_at=None
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except trip_planning_service.UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.get(
    "/trips/shared/{share_token}",
    response_model=tp_schemas.Trip,
    summary="Get trip by share link"
)
def get_trip_by_share_link(
    share_token: str,
    db_session: Session = Depends(db.get_db)
):
    """Access a trip via share link."""
    try:
        return trip_planning_service.get_trip_by_share_token(
            db=db_session,
            share_token=share_token
        )
    except trip_planning_service.TripNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


# ==================== Calendar Endpoints ====================

@router.get(
    "/calendar/trips",
    response_model=List[tp_schemas.CalendarTrip],
    summary="Get calendar view of trips"
)
def get_calendar_trips(
    user_id: uuid.UUID = Query(..., description="User ID"),
    year: int = Query(..., description="Year"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    db_session: Session = Depends(db.get_db)
):
    """Get trips for calendar view."""
    trips = trip_planning_service.get_user_trips(
        db=db_session,
        user_id=user_id
    )

    # Filter by year/month
    calendar_trips = []
    for trip in trips:
        if trip.start_date.year == year or trip.end_date.year == year:
            if month is None or trip.start_date.month == month or trip.end_date.month == month:
                calendar_trips.append(tp_schemas.CalendarTrip(
                    trip_id=trip.trip_id,
                    resort_id=trip.resort_id,
                    title=trip.title,
                    start_date=trip.start_date,
                    end_date=trip.end_date,
                    trip_status=trip.trip_status,
                    current_buddies=trip.current_buddies,
                    max_buddies=trip.max_buddies
                ))

    return calendar_trips


@router.get(
    "/calendar/year-overview",
    response_model=tp_schemas.YearOverview,
    summary="Get year overview"
)
def get_year_overview(
    user_id: uuid.UUID = Query(..., description="User ID"),
    year: int = Query(..., description="Year"),
    db_session: Session = Depends(db.get_db)
):
    """Get year overview with trip counts per month."""
    trips = trip_planning_service.get_user_trips(
        db=db_session,
        user_id=user_id
    )

    months_count = {}
    total_trips = 0
    completed_trips = 0

    for trip in trips:
        if trip.start_date.year == year or trip.end_date.year == year:
            total_trips += 1
            if trip.trip_status == TripStatus.COMPLETED:
                completed_trips += 1

            month = trip.start_date.month
            months_count[month] = months_count.get(month, 0) + 1

    return tp_schemas.YearOverview(
        year=year,
        months=months_count,
        total_trips=total_trips,
        completed_trips=completed_trips
    )
