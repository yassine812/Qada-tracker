# Qada Web Push

## Architecture

- The browser requests permission only from an explicit activation click. It registers the existing offline worker and a real PushManager subscription.
- A random device capability is kept in a separate IndexedDB database shared with the worker; only its SHA-256 hash is stored server-side. It is not included in worship-data backups.
- Vercel runs `api/notifications/[action].ts`. Supabase persists devices, preferences, jobs, delivery acknowledgements, rate limits and the daily verified Dua shuffle bag. Browser roles have no direct table/function access.
- Netlify forwards `/api/notifications/*` to the Vercel backend. API responses are never cached by the worker.
- Supabase `pg_cron` calls the Vercel endpoint every minute through `pg_net`, using a credential in Vault. Vercel Hobby's daily cron is not used.
- The scheduler plans three local calendar days, calculates prayer times with the existing Adhan settings, and leases due jobs atomically. Delivery requires an active device and matching preference revision.
- Morning, evening and sleep adhkar are automatic: they are sent 15 minutes after Fajr, Asr and Isha respectively, and are not editable clock reminders.
- Once the device has enabled push notifications, the schedule automatically includes Hijri 13/14/15 (Ayyam al-Bid): a preparation reminder on Hijri 12, a day-specific dua/advice, a pre-Maghrib dua/Quran reminder, and a congratulation after Maghrib. These messages do not require separate reminder settings; prayer times are calculated from the device's saved location and timezone.

## Environment and setup

Server-only variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `PUSH_ALLOWED_ORIGINS`.

The public configuration endpoint returns only the public VAPID key and scheduler health. No service-role/private VAPID key may use a `VITE_` prefix. Keep VAPID keys stable across redeploys; rotation requires explicit reactivation on existing devices.

1. Apply `supabase/migrations/202609150001_web_push.sql` to the intended project. The migration is additive and repeatable; it does not change existing user/worship tables.
2. Generate keys once with `node scripts/generate-push-secrets.mjs`. Its ignored output must remain private.
3. Configure Vercel's production environment and deploy. The owner-operated cloud helper is project-specific; do not reuse it for another customer/project without updating and reviewing its targets.
4. Verify `/api/notifications/config` returns JSON with the expected public key, not an SPA document.
5. Configure Vault and enable `supabase/push-scheduler.sql` using `scripts/activate-push-scheduler.mjs` only after the backend is healthy.
6. Build and publish `dist` to Netlify. Its `_redirects` file includes the API proxy.

## Operational limits and failure semantics

- Each tick plans up to 20 devices and processes up to 40 jobs (10 sends concurrently). Monitor queue age/volume and increase worker throughput before exceeding this capacity. This is a bounded initial deployment, not unlimited scale.
- A one-minute test is due 60 seconds after creation; the next minute tick adds up to about another minute, plus hosting/network/OS delays. Timing is not exact-to-the-second.
- Jobs expire after 15 minutes; outages do not cause an hours-long flood when the service returns. Transient errors retry at most four attempts with backoff. HTTP 404/410 disables the subscription.
- Database uniqueness, leases, deterministic push-service topics/notification tags, and durable worker seen IDs prevent ordinary retry duplication. No claim of exactly-once delivery is made across provider acceptance/DB acknowledgement crashes. The worker only marks a notification seen after `showNotification` succeeds.
- `lastSuccessfulPush` means the push service accepted the send. `lastDisplayedPush` means the worker acknowledged `showNotification`; neither proves that a person saw it. Focus settings and OS policy can suppress presentation. Receipt upload can fail while delivery succeeds.
- Travel updates when the app opens/returns online. Without opening the app, the server cannot know the device has changed timezone/location.
- Turning off notifications persists local intent first, unsubscribes the browser and deactivates server jobs. If offline, server cancellation is retried when the app returns online. Signing out of the optional account does not disable device subscriptions.
- Ended jobs are retained for 30 days; active/inactive device rows persist for ownership/re-registration. Do not silently erase unrelated records when cleaning test subscriptions.
- Supabase/Vercel quotas, project pauses, scheduler failures and push-provider outages can interrupt service. Configure monitoring/backups and review hosting plans before commercial launch; no paid plan is enabled by this implementation.

## Diagnostics and tests

Open `/app/notifications`. It checks feature support, permission, worker activity, native subscription, backend registration and public-key compatibility before saying enabled. It shows the automatic white-day schedule and the last scheduler tick, provider acceptance, worker acknowledgement, errors, timezone and standalone mode. The delayed test is disabled when scheduler health is stale.

Local checks: `npm run lint`, `npm run build`, `npm test`, `npm run test:push`.

The Push suite uses an actual embedded PostgreSQL engine for migration/ownership/queue/rate-limit/shuffle-bag checks, plus timezone/DST/calculated-prayer/security tests and the actual worker script with simulated browser APIs. These are **not** real mobile delivery tests.

Production acceptance checklist (record evidence, never infer PASS from local tests):

| Check | Required evidence |
| --- | --- |
| Android Chrome + installed PWA | Native subscription stored server-side; real system notification shown |
| iPhone installed PWA | iOS/iPadOS 16.4+, installed from Safari, permission from user tap; system notification shown |
| Closed app / locked phone | Same device receives remote notification while closed/locked |
| After one minute | Persisted test job delivered by server tick, page closed |
| Client offline | Document actual queued/expired OS delivery; core app remains usable |
| Reload / redeploy | Existing subscription still receives; no extra subscription required |
| Permission denied | No fake enabled state; recovery instructions shown |
| Revoked subscription | Inactive server row / reactivation path verified |
| Click / close | Correct deep-linked content and acknowledgement recorded |

For iPhone, opening a normal Safari tab is not equivalent to launching the Home Screen PWA. A desktop resized viewport cannot validate iPhone/Android Push, closed-app or lock-screen behavior.
