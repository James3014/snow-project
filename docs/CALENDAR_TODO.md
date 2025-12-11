# Unified Calendar TODO (TDD first)

1. Domain layer
   - [x] Define enums/value objects (TripVisibility, TripStatus, EventType, BuddyStatus, etc.)
   - [x] Implement domain models (Trip, Day, Item, CalendarEvent, TripBuddy, MatchingRequest) with validation helpers.
   - [x] Add domain unit tests（涵蓋 Trip/Day/Item/Event/TripBuddy/MatchingRequest）。

2. Repository layer
   - [x] SQLAlchemy models + migration（calendar_trips/...）。
   - [x] Trip/Event/TripBuddy repository + mapping helpers；fake repo for測試。

3. Service/Use-case layer
   - [x] TripService（create/list）。
   - [x] CalendarEventService（create/list）。
   - [x] TripBuddyService（invite/accept/decline + TDD）。
   - [x] MatchingService（create/list + TDD）。
   - [x] Day/Item 管理、Trip 更新。
   - [x] Event reminders（update API）。

4. API layer
   - [x] /calendar/trips, /calendar/events, /trips/{id}/buddies, /trips/{id}/matching, Day/Item create/list、Event update。
   - [x] Trip/Event/Buddy/Matching schema + TestClient tests。
   - [x] 基本限流（Redis/in-memory）/CAPTCHA for create endpoints。

5. Integration/safety
   - [x] Auth/Rate-limit/Bot protection applied。
   - [x] Smoke tests覆蓋 calendar trips/events。

6. Documentation
   - [x] API spec snippet (`docs/CALENDAR_API.md`).
   - [x] Notes on migration strategy (`docs/CALENDAR_MIGRATION.md`)。
