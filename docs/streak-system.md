# Account streaks and achievements

## Behavior

- A qualifying activity marks one calendar day, not one unit of progress. Repeated activities cannot multiply a streak.
- Opening the app counts once per calendar day in the account timezone. Returning tomorrow adds one day; repeated opens, reloads, and concurrent tabs cannot multiply it. Prayer recording, completing today's 70 istighfar, completing an adhkar collection, explicitly confirming Quran reading, and recording a fast also qualify, without counting the same day twice. Bookmarks, correcting balances, and historical istighfar additions do not.
- The entry streak reminder is remembered per account/day in persistent local storage, including after closing and reopening the app. A badge celebration replaces the ordinary entry reminder on milestone days. The welcome remains a separate launch-only experience.
- A streak remains current through the following day. After a full missed day it becomes zero; the next activity starts at one. Earned badges never reset.
- Milestones: 1, 3, 7, 14, 30, 60, 100, 180, 365 days. Existing old counters are not retroactively interpreted as dated activity.
- Dashboard: current streak, Saturday–Friday calendar, next badge progress. Profile: permanent achievements, earned dates, badge details, account timezone configuration.
- The first device initializes the account timezone. Other devices restore that setting. Changes affect future events, not saved dates.

## Persistence and sync

`StreakContext` coordinates an account-keyed IndexedDB cache (`qada-account-streaks`) and a durable pending event queue. Read/write transactions serialize local tab changes. In-flight acknowledgments remove only the events actually sent, preserving later activity.

`sync_daily_streak` is a security-definer Postgres function with a fixed search path. It derives the user exclusively from `auth.uid()`; callers cannot supply another account ID. Direct table writes are revoked. A row lock serializes concurrent sync operations for the same account. Unique constraints deduplicate event IDs, activity type/date, and badge IDs. The server derives awards from the union of active days rather than accepting arbitrary claimed badges.

Each sync HTTP request pins the checked account's bearer token. Logout/login cannot attach another account's token to an older request. Late responses cannot publish into another user's UI.

Online/focus/visibility events and a 30-second visible-page interval retry pending work and fetch remote activity. Offline awards are immediate and persist locally; the server confirms/deduplicates them on reconnect. Status distinguishes saved, pending, and failed sync. Account counters/backups are intentionally not used as the streak ledger.

Migration: `supabase/migrations/202609230001_streak_achievements.sql` (applied to the linked production project).

Daily visit activity type: `supabase/migrations/202610300001_daily_app_visits.sql` (applied to the linked production project on 2026-10-30).

2026-10-30 validation: 14 startup/streak tests passed, including same-day reopens,
tomorrow incrementing to two, account timezone, concurrent tabs, persisted daily
prompt dismissal, and the SQL activity constraint. The live two-client RPC check
also passed using daily visit events in a disposable QA account. TypeScript,
production build, and 38 offline/public/istighfar regressions passed. A 390px
component preview measured the istighfar button inside its card with 18px bottom
spacing and no horizontal page overflow; this is not a physical phone check.

## Verification performed

- `npm run test:streak`: 8 tests, including calendar/DST boundaries, first 1/2/3/7/8 days, missed day/restart, permanent awards, multiple activities, IndexedDB reload/account isolation, concurrent local writes, offline merge/retry, qualifying action wiring, SQL deduplication and authorization.
- `node scripts/test-streak-live.mjs --run`: two separate authenticated clients against the actual production RPC, concurrent activity uploads, both read directions, repeated batches, same-day events, logout/login, permanent awards, and anonymous denial. The disposable QA account and its rows were removed in the test's cleanup. Existing account data was not changed.
- Browser component preview: actual IndexedDB persistence across reload, seven-day unlock/dialog dismissal, a missed day retaining three awards, mobile badge details, light/dark layouts at desktop and 390px, nine badge tiles, no horizontal overflow.
- Existing regression suite: 63 passing tests. TypeScript and production build checked.

## Remaining acceptance boundary

The browser component preview and two authenticated API clients are **not** a physical iPhone test. End-to-end logged-in production UI verification on the user's PC/iPhone was not performed: the accessible production browser was at the login form. Do not describe the new feature as physically device-verified based on the earlier cross-device check.

Physical device smoke test: complete a real qualifying activity; view dashboard and Profile → إنجازاتي; refresh; sign out/in; open the same account on the other device; confirm matching streak, earned dates and badges after sync. Also exercise airplane-mode activity and reconnection. Never add fabricated worship records to a real user's account for testing.
