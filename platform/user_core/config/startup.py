"""Application startup events."""
from pathlib import Path

from services import db, course_tracking_service


def load_achievement_definitions() -> None:
    """Load achievement definitions on startup."""
    yaml_path = Path(__file__).parent.parent / "data" / "achievement_definitions.yaml"
    
    if not yaml_path.exists():
        print(f"⚠️ Achievement definitions file not found at {yaml_path}")
        return
    
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
