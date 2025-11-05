#!/usr/bin/env python3
"""
Load sample notification preferences for testing.

Usage:
    python scripts/seeds/load_sample_preferences.py \\
        --db-url sqlite:///./user_core.db \\
        --source data/notification_preference_templates.yaml

This script creates default notification preferences for all users.
"""
import argparse
import sys
from pathlib import Path
import json


def parse_args():
    parser = argparse.ArgumentParser(description='Load sample notification preferences')
    parser.add_argument('--db-url', required=True, help='Database URL')
    parser.add_argument('--source', help='Source YAML/JSON file (optional)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    return parser.parse_args()


# Add user_core to path
project_root = Path(__file__).resolve().parents[2]
user_core_path = project_root / "platform" / "user_core"
sys.path.insert(0, str(user_core_path))


def create_default_preferences():
    """Create default notification preference templates."""
    return [
        {
            "channel": "email",
            "topic": "lesson_reminder",
            "status": "opt-in",
            "frequency": "immediate",
            "description": "Lesson reminders via email"
        },
        {
            "channel": "email",
            "topic": "match_found",
            "status": "opt-in",
            "frequency": "daily",
            "description": "Snowbuddy match notifications"
        },
        {
            "channel": "push",
            "topic": "lesson_reminder",
            "status": "opt-out",
            "frequency": "immediate",
            "description": "Push notifications for lessons"
        },
        {
            "channel": "push",
            "topic": "match_found",
            "status": "opt-out",
            "frequency": "immediate",
            "description": "Push notifications for matches"
        },
        {
            "channel": "sms",
            "topic": "lesson_reminder",
            "status": "opt-out",
            "frequency": "immediate",
            "description": "SMS lesson reminders"
        }
    ]


def load_preferences_to_db(db_url: str, preferences: list, dry_run: bool = False):
    """Load preferences into database."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from models.user_profile import UserProfile
    from models.notification_preference import NotificationPreference, Base
    from models.enums import NotificationStatus, NotificationFrequency

    engine = create_engine(db_url)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get all active users
        users = session.query(UserProfile).filter_by(status='active').all()
        print(f"Found {len(users)} active users")

        if dry_run:
            print("\nDRY RUN: Would create these preferences for each user:")
            for pref in preferences:
                print(f"  - {pref['channel']}:{pref['topic']} = {pref['status']} ({pref['frequency']})")
            print(f"\nTotal preferences to create: {len(users) * len(preferences)}")
            return

        created_count = 0
        for user in users:
            for pref_template in preferences:
                # Check if preference already exists
                existing = session.query(NotificationPreference).filter_by(
                    user_id=user.user_id,
                    channel=pref_template['channel'],
                    topic=pref_template['topic']
                ).first()

                if not existing:
                    pref = NotificationPreference(
                        user_id=user.user_id,
                        channel=pref_template['channel'],
                        topic=pref_template['topic'],
                        status=NotificationStatus(pref_template['status']),
                        frequency=NotificationFrequency(pref_template['frequency'])
                    )
                    session.add(pref)
                    created_count += 1

        session.commit()
        print(f"✓ Created {created_count} notification preferences")

    finally:
        session.close()


def main():
    args = parse_args()

    print("Loading notification preference templates...")
    preferences = create_default_preferences()

    if args.source:
        print(f"Loading templates from {args.source}...")
        import yaml
        with open(args.source) as f:
            if args.source.endswith('.yaml') or args.source.endswith('.yml'):
                preferences = yaml.safe_load(f)
            else:
                preferences = json.load(f)

    print(f"Found {len(preferences)} preference templates")

    print(f"Connecting to database: {args.db_url}")
    load_preferences_to_db(args.db_url, preferences, args.dry_run)

    if not args.dry_run:
        print("\n✓ Sample preferences loaded successfully")


if __name__ == '__main__':
    main()
