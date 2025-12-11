# Calendar API Overview

## Trips
- `POST /calendar/trips`
  - Body: `title`, `start_date`, `end_date`, optional `timezone`, `visibility`, `status`, `resort_id`, `note`…
  - Auth required (Bearer). Rate-limited per user.
- `GET /calendar/trips`
  - Returns list of trips for current user.

## Events
- `POST /calendar/events`
  - Body: `type`, `title`, `start_date`, `end_date`, `all_day`, etc.
- `GET /calendar/events`
  - Returns user events.

## Buddies
- `POST /calendar/trips/{trip_id}/buddies`
  - Invite user to trip; body `user_id`, optional `message`.
- `POST /calendar/trip-buddies/{buddy_id}/respond`
  - Accept/decline invite.
- `GET /calendar/trips/{trip_id}/buddies`
  - List buddies for trip.

## Matching
- `POST /calendar/trips/{trip_id}/matching`
  - Body: `preferences` JSON; requires `X-Captcha-Token`, rate-limited.
- `GET /calendar/trips/{trip_id}/matching`
  - List matching requests & results for trip.
- `PATCH /calendar/trips/{trip_id}` 更新行程資訊。
- `POST /calendar/trips/{trip_id}/days` / `GET /calendar/trips/{trip_id}/days`
- `POST /calendar/items` / `GET /calendar/days/{day_id}/items`
- **權限/限流**：所有路由需 Bearer token；行程/事件/媒合操作套用簡易速率限制；媒合需 `X-Captcha-Token`。
