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
   - [ ] Event reminders / notifications。

4. API layer
   - [x] /calendar/trips, /calendar/events, /trips/{id}/buddies, /trips/{id}/matching (create/list)，Day/Item create/list。
   - [x] Trip/Event/Buddy/Matching schema + TestClient tests。
   - [ ] 權限/限流/bot protection for新路由（需 Edge/Redis 落地）。

5. Integration/safety
   - [x] Apply auth to /calendar/trips；rate-limit/bot-protection for其他端點待擴充。
   - [ ] Update smoke tests to hit new endpoints once available.

6. Documentation
   - [x] API spec snippet (`docs/CALENDAR_API.md`).
   - [ ] Notes on migration strategy (even if fresh start now)。
