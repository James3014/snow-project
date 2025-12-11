import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services import db, course_tracking_service
from models import (
    user_profile, behavior_event, notification_preference,
    course_tracking, social,
    trip_planning as trip_planning_models,
    gear as gear_models
)
from api import (
    user_profiles, behavior_events, notification_preferences, auth, admin,
    course_tracking as course_tracking_api, share_cards,
    social as social_api, ski_map, trip_planning, gear, calendar, casi_skills
)

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
except ImportError:
    sentry_sdk = None  # Optional dependency; skip if not installed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("user_core")

if sentry_sdk and os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
    )

# Create all tables (for development only)
user_profile.Base.metadata.create_all(bind=db.engine)
behavior_event.Base.metadata.create_all(bind=db.engine)
notification_preference.Base.metadata.create_all(bind=db.engine)
course_tracking.Base.metadata.create_all(bind=db.engine)
social.Base.metadata.create_all(bind=db.engine)
trip_planning_models.Base.metadata.create_all(bind=db.engine)
gear_models.Base.metadata.create_all(bind=db.engine)

app = FastAPI(
    title="SnowTrace User Core Service",
    version="1.0.0",
    description="Manages user profiles, preferences, and behavior events for the SnowTrace platform."
)

# Configure CORS - Allow frontend to access backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local Vite dev server
        "http://localhost:3000",  # Local production build
        "http://127.0.0.1:5173",  # Local Vite dev server (alternative)
        "https://ski-platform.zeabur.app",  # Production frontend
    ],
    allow_origin_regex=r"https://.*\.zeabur\.app",  # All Zeabur deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(user_profiles.router, prefix="/users", tags=["User Profiles"])
app.include_router(behavior_events.router, prefix="/events", tags=["Behavior Events"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(admin.router, tags=["Admin"])
# A bit of a workaround to nest preferences under a user
app.include_router(notification_preferences.router, prefix="/users/{user_id}/preferences", tags=["Notification Preferences"])
app.include_router(course_tracking_api.router, prefix="/users", tags=["Course Tracking"])
app.include_router(share_cards.router, prefix="/api", tags=["Share Cards"])
# Social features
app.include_router(social_api.router, prefix="/social", tags=["Social Features"])
# Ski map
app.include_router(ski_map.router, prefix="/ski-map", tags=["Ski Map"])
# Trip planning
app.include_router(trip_planning.router, prefix="/trip-planning", tags=["Trip Planning"])
# Gear operations
app.include_router(gear.router, prefix="/api", tags=["Gear Operations"])
# Calendar
app.include_router(calendar.router)
# CASI Skills (for Snowbuddy matching)
app.include_router(casi_skills.router, tags=["CASI Skills"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return sanitized error responses and log details."""
    logger.exception("Unhandled error", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
def startup_event():
    """Load achievement definitions on startup."""
    import os
    from pathlib import Path

    # Find achievement definitions YAML file
    yaml_path = Path(__file__).parent.parent / "data" / "achievement_definitions.yaml"

    if yaml_path.exists():
        db_session = next(db.get_db())
        try:
            count = course_tracking_service.load_achievement_definitions(
                db=db_session,
                yaml_path=str(yaml_path)
            )
            print(f"✅ Loaded {count} achievement definitions")
        except Exception as e:
            print(f"⚠️ Failed to load achievement definitions: {e}")
        finally:
            db_session.close()
    else:
        print(f"⚠️ Achievement definitions file not found at {yaml_path}")


@app.get("/health", summary="Health Check")
def health_check():
    """Provides a simple health check endpoint to verify the service is running."""
    return {"status": "ok"}
