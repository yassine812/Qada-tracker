# Qada

Qada tracks missed prayers, fasting and adhkar, and provides Quran reading.
Users open its link in Safari on iPhone or a browser on Android and select
«افتح التطبيق». No Apple account, Sideloadly, installation, Home Screen shortcut,
or phone configuration is required. The initial questions calculate prayer totals;
they do not configure the device or create an account.

## Local development

Install Node.js, then run:

```sh
npm ci
npm run dev
```

The development server runs at `http://localhost:3000` and requires a connection
to that server. Offline behavior is enabled for production builds, not the Vite
development server.

## Build and test offline use

```sh
npm run lint
npm run build
npm test
npm run preview
```

Open the preview URL printed by Vite. On the first visit, keep the connection
available while Qada automatically prepares its local files in the background.
After «جاهز بدون إنترنت» appears, disable the connection and reload `/app` in
the same browser. Verify prayer counters, fasting, adhkar, and Quran reading,
then close and reopen the page and verify that local records remain available.
No installation or manual download step is needed.

Offline preparation requires HTTPS or `localhost`. A plain HTTP address on
another computer, such as a LAN IP opened on an iPhone, is not a secure context
and cannot be used to validate service-worker offline behavior. Use an HTTPS
deployment for physical-phone testing. Publish the production `dist` directory
with a single-page fallback to `index.html` for `/app`.

## Offline scope and storage

Prayer and fasting records, adhkar, and Quran text remain available offline
after preparation while the browser retains the site's files. Quran audio and
loading a new tafsir require an internet connection. Your records are stored
locally; Settings provides backup export and restore.

Browser storage is not permanent. Safari or another browser may clear or evict
site files, and clearing browsing data removes the offline copy. If that happens,
open Qada online again to prepare it; recover any deleted personal records from
an exported backup. An offline-ready message confirms the current stored copy,
not a guarantee that a browser will retain it forever.

Reminders can appear while the app is open. Background iOS notifications are not
available in ordinary browser tabs, and this app has no push server to send
scheduled notifications when it is closed.

## Free hosting and advertising preparation

See [Netlify launch](docs/netlify-launch.md) and [AdSense setup](docs/adsense-setup.md).
Only the `dist` directory is intended for public deployment. Public information
and guides are pre-rendered for users and crawlers; private tracker routes are
excluded from search indexing. Advertising is off by default and cannot activate
without the real publisher configuration, approval and a functioning certified
consent platform. Nothing about this preparation guarantees Google approval.

The Android browser can offer installation when its installability criteria are
met. iPhone users can use the website directly. The experimental iOS scaffold
is deferred; no Apple developer account or native distribution is part of this launch.
