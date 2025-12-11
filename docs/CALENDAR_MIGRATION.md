# Calendar Migration Notes

1. **Fresh start (no legacy data now)**
   - Apply Alembic revision `202502150001_add_calendar_tables.py`.
   - Ensure `calendar_trips/...` tables exist before enabling API routes.

2. **Future migration from legacy trip_planning**
   - Export trips/days/items from `trip_planning.py` tables.
   - Map fields:
     - `trips` -> `calendar_trips` (convert enums, convert Date to DateTime with timezone).
     - `trip_buddies` -> `calendar_trip_buddies`.
     - `seasons` data can map to metadata columns or remain separate.
   - For events, create CalendarEvent rows based on trip start/end.

3. **Data import pipeline idea**
   - Use a one-off script that reads existing tables, constructs domain objects (Trip.create, Day.create, ...), and persists via repositories.
   - Validate user ownership + deduplicate share tokens.

4. **Backfill reminders / external sync**
   - When enabling Google/Outlook sync, store external IDs in new columns provided.
