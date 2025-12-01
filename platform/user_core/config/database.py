"""Database initialization."""
from services import db
from models import (
    user_profile, behavior_event, notification_preference,
    course_tracking, social,
    trip_planning as trip_planning_models,
    buddy_matching
)


def init_database() -> None:
    """Create all database tables (for development only)."""
    user_profile.Base.metadata.create_all(bind=db.engine)
    behavior_event.Base.metadata.create_all(bind=db.engine)
    notification_preference.Base.metadata.create_all(bind=db.engine)
    course_tracking.Base.metadata.create_all(bind=db.engine)
    social.Base.metadata.create_all(bind=db.engine)
    trip_planning_models.Base.metadata.create_all(bind=db.engine)
    buddy_matching.Base.metadata.create_all(bind=db.engine)
