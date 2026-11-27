# Production verification — 2026-09-15

## Deployment and server evidence

- Vercel production: `dpl_EuPw6JrRjt57hyRr1EATZ8YP12tj`, aliased to `https://qada-tracker-five.vercel.app`.
- Netlify production: `6aa900222a308362ca026ef7`, published to `https://qada-tracker-yassine.netlify.app`.
- Netlify offline build: `6c4cb12032cc9deb7b91`.
- Supabase: additive Web Push migration applied to `qolmdufbnzulyayxccxc`; all six push tables have RLS enabled.
- Scheduler: `qada-web-push-every-minute`, active, every minute, credentials in Vault. Actual `pg_net` response HTTP 200, no timeout/error; `push_health.last_tick` observed at `2026-09-15T08:21:00.469Z` and advancing on subsequent minute ticks.
- `/api/notifications/config` returns JSON HTTP 200 through both Vercel and the Netlify proxy, with fresh scheduler health.
- Unauthenticated `/status`, `/test`, and `/cron` requests return HTTP 401, not an SPA fallback. Responses are `no-store`.
- `node scripts/check-live-push.mjs`: all 143 required Netlify offline files available; HTML build markers match; no HTML fallback replacing required assets.
- Private VAPID key, cron secret and service-role credential checked against the actual browser JS bundles: absent.

## Automated checks

- TypeScript (`npm run lint`): PASS.
- Production build (`npm run build`): PASS.
- Existing app regression tests (`npm test`): 62/62 PASS.
- Web Push tests (`npm run test:push`): 12/12 PASS.
- Actual deployed settings rendered in the in-app browser. Its previous offline shell required completion of the cache update and a reload before the new route appeared. No worship data or browser storage was cleared.
- Production diagnostics: service worker active, offline ready, Push API supported, notification permission **denied**. UI correctly says permission denied, shows recovery instructions, and does not claim enabled. This browser cannot currently validate real delivery.

## Requested real-device acceptance cases

NOT TESTED means no adequate device evidence, not a successful test inferred from automation.

| Test | Status | Evidence / missing step |
| --- | --- | --- |
| 1. Android Chrome | NOT TESTED | Requires a real Android subscription and visible system notification. |
| 2. Android installed PWA | NOT TESTED | Requires installed PWA on Android. |
| 3. iPhone Home Screen PWA | NOT TESTED | Requires supported iPhone with Qada launched from its Home Screen icon. |
| 4. App completely closed | NOT TESTED | No real recipient device registered at the deployment check. |
| 5. Phone locked | NOT TESTED | Requires physical phone and user observation. |
| 6. One-minute scheduled push, app closed | NOT TESTED | Scheduler HTTP chain verified; no real push recipient yet. |
| 7. Client offline | NOT TESTED on device | Offline regression suite passes; provider/OS delayed-delivery behavior needs physical testing. |
| 8. Refresh/redeploy preserves subscription | NOT TESTED end-to-end | Durable worker and database tests pass; real subscription must be tested across redeployment. |
| 9. Permission denied | PASS on desktop in-app browser only | Correct denied label/instructions, active worker, no false enabled status. Mobile-specific behavior not yet tested. |
| 10. Revoked subscription | NOT TESTED end-to-end | Simulated 404/410 and recovery logic covered; no real revoked subscription exercised. |

Actual system notification display, `notificationclick`, and backend displayed/clicked acknowledgements remain unverified until a real device is subscribed. Do not describe this acceptance checklist as complete.

## Next device step

1. Open `https://qada-tracker-yassine.netlify.app/app/notifications` on Android Chrome, or from the installed Qada icon on iPhone.
2. Press **تفعيل الإشعارات**, accept OS permission, and verify **الإشعارات مفعلة ✓**.
3. Press **اختبار إشعار الآن**, verify the system notification, then tap it. Refresh diagnostics and compare accepted/displayed/clicked acknowledgements.
4. Press **اختبار إشعار بعد دقيقة**, close Qada and lock the phone. Allow approximately 1–2 minutes plus OS/network delay. Record actual result.
5. Repeat the remaining checklist scenarios without calling an unobserved result PASS.

No paid hosting upgrade was enabled. The queue has explicitly bounded initial capacity; see `web-push.md` before commercial-scale rollout.

## 2026-10-15: production outage repair and essential defaults

- Confirmed production config and cron were crashing with `ERR_MODULE_NOT_FOUND`: the shared `pushPreferences` module imported `prayerTimes` without the `.js` extension required by Node ESM. Fixed the import; plain Node now successfully loads the compiled API graph (`npm run test:push-runtime`).
- Deployed `dpl_wxfMVSxoTRCskJM6qs1CPihEtDRa` to https://qada-tracker-five.vercel.app. Config now returns HTTP 200, `configured: true`; scheduler resumed at `2026-10-15T14:53:00.312+01:00` with no error. Vercel cron logs confirm schedules were generated for existing subscriptions. This is server scheduling evidence, not proof of phone display.
- New preferences enable all five prayers, automatic prayer-relative adhkar, and daily istighfar at 20:00 local time. Existing explicit opt-outs remain preserved. A new home activation button explicitly restores these essentials on older installs after the user's tap.
- Reconciliation restores missing/inactive backend registration for an already-authorized, enabled browser subscription. It never prompts for permission or re-enables an opted-out device.
- Home now explains iPhone Home Screen installation; notification settings expose immediate and one-minute server test buttons. Permission is still mandatory, device-specific, and cannot be silently granted by the app.
- Verification: 17 push tests; 63 existing regression tests; production ESM import; TypeScript; production build. Prayer card visually checked at 320px, 390px and 1440px in light/dark, with six times, no horizontal overflow, working location dialog and no browser exceptions.
- Real iPhone locked/closed-app receipt is still NOT TESTED. Open the installed Vercel app, enable reminders, then use the one-minute test and verify the system notification on the physical phone.
