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
