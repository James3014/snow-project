from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services import db, course_tracking_service
from models import user_profile, behavior_event, notification_preference, course_tracking
from api import user_profiles, behavior_events, notification_preferences, auth, course_tracking as course_tracking_api

# Create all tables (for development only)
user_profile.Base.metadata.create_all(bind=db.engine)
behavior_event.Base.metadata.create_all(bind=db.engine)
notification_preference.Base.metadata.create_all(bind=db.engine)
course_tracking.Base.metadata.create_all(bind=db.engine)

app = FastAPI(
    title="SkiDIY User Core Service",
    version="1.0.0",
    description="Manages user profiles, preferences, and behavior events for the SkiDIY platform."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "http://localhost:3000",  # Local production build
        "https://ski-platform.zeabur.app",  # Production frontend
    ],
    allow_origin_regex=r"https://.*\.zeabur\.app",  # All Zeabur subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_profiles.router, prefix="/users", tags=["User Profiles"])
app.include_router(behavior_events.router, prefix="/events", tags=["Behavior Events"])
app.include_router(auth.router, tags=["Authentication"])
# A bit of a workaround to nest preferences under a user
app.include_router(notification_preferences.router, prefix="/users/{user_id}/preferences", tags=["Notification Preferences"])
app.include_router(course_tracking_api.router, prefix="/users", tags=["Course Tracking"])

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
