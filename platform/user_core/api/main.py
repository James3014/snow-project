from fastapi import FastAPI

from services import db
from models import user_profile, behavior_event, notification_preference
from api import user_profiles, behavior_events, notification_preferences

# Create all tables (for development only)
user_profile.Base.metadata.create_all(bind=db.engine)
behavior_event.Base.metadata.create_all(bind=db.engine)
notification_preference.Base.metadata.create_all(bind=db.engine)

app = FastAPI(
    title="SkiDIY User Core Service",
    version="1.0.0",
    description="Manages user profiles, preferences, and behavior events for the SkiDIY platform."
)

app.include_router(user_profiles.router, prefix="/users", tags=["User Profiles"])
app.include_router(behavior_events.router, prefix="/events", tags=["Behavior Events"])
# A bit of a workaround to nest preferences under a user
app.include_router(notification_preferences.router, prefix="/users/{user_id}/preferences", tags=["Notification Preferences"])

@app.get("/health", summary="Health Check")
def health_check():
    """Provides a simple health check endpoint to verify the service is running."""
    return {"status": "ok"}
