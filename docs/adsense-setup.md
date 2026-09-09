# Qada advertising activation checklist

The repository prepares an optional web AdSense integration. It does **not** create an AdSense account, approve the site, install a certified consent platform, or generate revenue. Advertising is disabled by default. No publisher ID, bank details, or invented consent is shipped.

## Complete the owner steps first

1. Publish the production site on HTTPS, on hosting whose plan permits commercial use. Keep it publicly readable without login. Review the guides, About and Privacy pages and supply a genuine publisher contact and accurate operator information in About/Privacy before applying.
2. Create your account at [Google AdSense](https://adsense.google.com/start/). Enter identity, address, tax and payment details directly in Google, never in this repository or a chat. Add the final production domain and complete Google's site verification and review. Approval and revenue are not guaranteed.
3. Prefer Google's supported `google-adsense-account` meta-tag verification method while ads remain disabled. Use only your actual publisher ID. Do not paste an unconditional global ad script into the shared app shell simply to verify ownership.
4. Set up a currently [Google-certified CMP](https://support.google.com/adsense/answer/13554116?hl=en) supporting the current IAB TCF. It must disclose Google Advertising Products (vendor 755), obtain the necessary consents, propagate the full TC string and provide a persistent, accessible way to refuse and withdraw consent. Review other regional privacy requirements and configure the CMP accordingly. Non-personalized ads still may use cookies and are not a consent exemption.
5. **Install the CMP independently of the ad tag**, using the CMP vendor's official instructions. This code waits for an already-running `window.__tcfapi`; it does not install a CMP or show a home-made consent banner. Configure the CMP to request consent wherever these ad slots may run. The application conservatively requires explicit Google/Purpose 1 consent and a TC string even when `gdprApplies` is false; otherwise it shows no ads. The minimal application gate does not replace the CMP's full policy/legal validation.
6. Google's Privacy & messaging interface is a possible CMP product, but its messages normally deploy through the AdSense tag. **Simply enabling a Google message in the dashboard does not bootstrap this consent-first integration.** Do not bypass the gate to make a message appear. Use an independently loaded certified CMP, or separately implement and verify an officially supported standalone consent bootstrap before activation. See [Google's API documentation](https://developers.google.com/funding-choices/fc-api-docs).
7. After approval, create a responsive **Display ad unit** in AdSense. Turn **Auto ads off** for this site; disable automatic placements, anchors, vignettes and ad intents. Our implementation uses only the explicit guide unit. Review content/category blocking controls for Qada's audience. Do not use AdSense inside a native WebView wrapper; a future native app needs its own policy review and typically AdMob.

## Production configuration

Set these build-time environment variables in the hosting dashboard, using the actual values from your account:

```dotenv
VITE_ADS_ENABLED=false
VITE_ADSENSE_APPROVED=false
VITE_ADSENSE_CLIENT=
VITE_ADSENSE_GUIDE_SLOT=
VITE_PUBLISHER_NAME=
VITE_CONTACT_EMAIL=
```

- `VITE_ADSENSE_CLIENT`: `ca-pub-` followed by your 16-digit publisher number.
- `VITE_ADSENSE_GUIDE_SLOT`: the ad unit's numeric ID, 6–20 digits.
- `VITE_ADS_ENABLED`: change to the exact string `true` **only after the account, site approval, valid publisher identity/contact, certified CMP and consent withdrawal behavior have all been verified**.
- `VITE_ADSENSE_APPROVED`: an owner-confirmed gate, not an API check. Set to `true` only after Google's dashboard confirms site approval.
- `VITE_PUBLISHER_NAME` and `VITE_CONTACT_EMAIL`: genuine, public operator information. These must be supplied before activation; they are displayed on the public information pages.
- These are public publisher identifiers, not secrets. Never put an account password or private token in a `VITE_` variable.
- Rebuild and redeploy after changing configuration. Use the generated `ads.txt`/verification behavior described by the project's deployment documentation; verify the file at the site's root against Google's account instructions. Do not invent or copy another publisher's record.

## Where and how ads work

Only the exact paths `/guides/offline` and `/guides/backup`, without a query string or hash, are eligible. Ads are not mounted on the landing page, prayer counters, Quran, dhikr, app settings, privacy page or app aliases. Guide navigation back into the app uses full-document navigation so previously loaded ad code is not carried into prayer screens. The ad container is clearly marked `إعلان`, separated from controls, and collapses on failure, timeout or an unfilled result.

No AdSense script or request is initiated until the independent CMP supplies a loaded consent event and the minimum gate passes. [Google documents](https://support.google.com/adsense/answer/9804260?hl=en) the TCF integration and minimum storage-consent requirement; its tag consumes the full TC string. The code sets the supported [`requestNonPersonalizedAds=1`](https://support.google.com/adsense/answer/9042142?hl=en) flag before each request. No prayer totals, religious activity records, local backup content, location settings or personal app identifiers are provided by the integration. Google may process normal ad-request metadata and the public guide URL when an ad is requested; non-personalized does not mean zero processing.

Consent refusal, a missing/unavailable CMP, ad blocking and loss of connectivity never gate app access. On consent withdrawal the slot is removed, new requests are blocked and pending ad requests are paused. A downloaded third-party script cannot be fully unexecuted by removing a DOM node: the CMP must manage consent/cookie changes, and a full-page reload or navigation clears the existing document's script execution. The optional Google consent-preferences button uses the documented `googlefc` API only if it is already available. A third-party CMP must retain its own persistent privacy link. No local `accepted=true` flag is used as consent.

## Verify before enabling real traffic

Run `node --test scripts/test-advertising.mjs` and the production build. The automated tests are offline mocks: they create no real Google ad requests or impressions. On an owner-controlled preview with no live ads, verify mobile layout and the absence of ad containers/scripts on all app routes. With your approved CMP, verify refusal, acceptance, reopening preferences, withdrawal, offline navigation, script blocking and fresh page loads. Use Google's official preview/debug tools to inspect consent and ad behavior; **never click your own live ads or ask users to click them**. Avoid repeated automated reloads of live ad pages and do not send artificial traffic.

Only after that review should you deploy `VITE_ADS_ENABLED=true`. Revenue depends on eligible traffic, auction demand and policy compliance, not installations. Payment also requires Google's identity/payment checks and the applicable [payment threshold](https://support.google.com/adsense/answer/1709871?hl=en). Keep advertising disabled if any activation prerequisite is unresolved.
