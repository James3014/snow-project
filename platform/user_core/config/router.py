"""Route registration for the application."""
from fastapi import FastAPI

from api import (
    user_profiles, behavior_events, notification_preferences, auth, admin,
    course_tracking as course_tracking_api, share_cards,
    social as social_api, ski_map, trip_planning, ski_preferences
)


def register_routes(app: FastAPI) -> None:
    """Register all API routes."""
    app.include_router(user_profiles.router, prefix="/users", tags=["User Profiles"])
    app.include_router(behavior_events.router, prefix="/events", tags=["Behavior Events"])
    app.include_router(auth.router, tags=["Authentication"])
    app.include_router(admin.router, tags=["Admin"])
    app.include_router(
        notification_preferences.router, 
        prefix="/users/{user_id}/preferences", 
        tags=["Notification Preferences"]
    )
    app.include_router(course_tracking_api.router, prefix="/users", tags=["Course Tracking"])
    app.include_router(
        ski_preferences.router,
        prefix="/users/{user_id}/ski-preferences",
        tags=["Ski Preferences"]
    )
    app.include_router(share_cards.router, prefix="/api", tags=["Share Cards"])
    app.include_router(social_api.router, prefix="/social", tags=["Social Features"])
    app.include_router(ski_map.router, prefix="/ski-map", tags=["Ski Map"])
    app.include_router(trip_planning.router, prefix="/trip-planning", tags=["Trip Planning"])
