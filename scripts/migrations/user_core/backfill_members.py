#!/usr/bin/env python3
"""
Backfill script for migrating legacy member data to user_profiles.

Usage:
    python scripts/migrations/user_core/backfill_members.py \\
        --members members-utf8.csv \\
        --output tmp/user_profile_backfill.csv \\
        --db-url postgresql://...

This script:
1. Reads legacy member CSV data
2. Transforms it to user_profile format
3. Generates SQL or CSV for import
4. Creates legacy_mappings for traceability
"""
import argparse
import csv
import sys
import uuid
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, List, Any


def parse_args():
    parser = argparse.ArgumentParser(description='Backfill members to user_profiles')
    parser.add_argument('--members', required=True, help='Path to members CSV file')
    parser.add_argument('--output', required=True, help='Output CSV path')
    parser.add_argument('--db-url', help='Database URL for direct import (optional)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    return parser.parse_args()


def read_legacy_members(csv_path: str) -> List[Dict[str, Any]]:
    """Read legacy members from CSV."""
    members = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            members.append(row)
    return members


def transform_member_to_profile(member: Dict[str, Any]) -> Dict[str, Any]:
    """Transform legacy member data to UserProfile format."""
    user_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()

    # Map legacy fields to new schema
    profile = {
        'user_id': user_id,
        'legacy_ids': {
            'old_member_id': member.get('member_id', ''),
            'old_email': member.get('email', '')
        },
        'preferred_language': member.get('language', 'zh-TW'),
        'experience_level': member.get('skill_level', 'beginner'),
        'roles': [member.get('role', 'student')],
        'coach_cert_level': member.get('certification', None),
        'bio': member.get('bio', None),
        'preferred_resorts': [],
        'teaching_languages': [],
        'legal_consent': {
            'privacy_version': '1.0',
            'marketing_opt_in': member.get('marketing_opt_in', 'false').lower() == 'true',
            'consented_at': member.get('joined_date', now)
        },
        'status': 'active',
        'created_at': member.get('joined_date', now),
        'updated_at': now
    }

    return profile


def write_backfill_csv(profiles: List[Dict[str, Any]], output_path: str):
    """Write transformed profiles to CSV."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        'user_id', 'legacy_ids', 'preferred_language', 'experience_level',
        'roles', 'coach_cert_level', 'bio', 'preferred_resorts',
        'teaching_languages', 'legal_consent', 'status', 'created_at', 'updated_at'
    ]

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for profile in profiles:
            # Convert complex fields to JSON strings for CSV
            import json
            row = profile.copy()
            for field in ['legacy_ids', 'roles', 'preferred_resorts', 'teaching_languages', 'legal_consent']:
                if field in row and row[field] is not None:
                    row[field] = json.dumps(row[field])
            writer.writerow(row)


def main():
    args = parse_args()

    print(f"Reading legacy members from {args.members}...")
    members = read_legacy_members(args.members)
    print(f"Found {len(members)} members")

    print("Transforming to user profiles...")
    profiles = [transform_member_to_profile(m) for m in members]

    if args.dry_run:
        print("\nDRY RUN: First 3 transformed profiles:")
        import json
        for profile in profiles[:3]:
            print(json.dumps(profile, indent=2))
        print(f"\nWould write {len(profiles)} profiles to {args.output}")
        return

    print(f"Writing backfill CSV to {args.output}...")
    write_backfill_csv(profiles, args.output)
    print(f"✓ Wrote {len(profiles)} profiles")

    if args.db_url:
        print(f"\nDirect DB import not implemented yet.")
        print(f"Please use the CSV file with COPY command or bulk insert tool.")

    print("\nNext steps:")
    print("1. Review the output CSV")
    print("2. Import to database using:")
    print(f"   COPY user_profiles FROM '{args.output}' CSV HEADER;")
    print("3. Verify import with SELECT count(*) FROM user_profiles;")
    print("4. Create legacy_mappings entries")


if __name__ == '__main__':
    main()
