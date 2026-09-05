# app.esporta.site — deep-link association + web fallback

This folder is the whole of `app.esporta.site`: a small Next.js site that does two
jobs, and nothing else.

1. **Serves the two domain-association files** that let Android App Links and iOS
   Universal Links hand a canonical Esporta URL to the installed app.
2. **Renders a fallback page** for the same URLs when the app is *not* installed,
   so a shared link never dead-ends in a browser.

No Flutter code was touched. `lib/core/services/esporta_links.dart` still owns the
link grammar; this site mirrors it read-only. `assetlinks.json` is unchanged from
when it was first written — it only moved into `public/`.

---

## 1. What is here

```
esporta-deeplinking/
├── public/
│   ├── .well-known/
│   │   ├── assetlinks.json             # Android App Links (Digital Asset Links)
│   │   └── apple-app-site-association  # iOS Universal Links (NO .json extension)
│   ├── esporta_text_logo.png           # the wordmark shown on every page
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # metadataBase, favicon, palette, viewport
│   │   ├── not-found.tsx               # the real 404 — dead links AND `/`
│   │   ├── robots.ts
│   │   ├── p/[id]/page.tsx             # post
│   │   ├── s/[id]/page.tsx             # short
│   │   ├── pp/[id]/page.tsx            # personal profile
│   │   └── op/[id]/page.tsx            # team / organiser / news page
│   ├── components/
│   │   ├── link-page.tsx               # the one implementation behind all four routes
│   │   ├── post-preview.tsx
│   │   ├── profile-preview.tsx
│   │   ├── get-app.tsx                 # the "Get Esporta" CTA
│   │   └── site-frame.tsx              # wordmark, avatar, verified tick
│   ├── lib/  (config, links, preview, format)
│   └── styles/globals.css              # the Esporta palette
├── scripts/check-site.py               # black-box check of a deployment
├── verify.sh                           # offline check of the files in this repo
├── next.config.ts  package.json  tsconfig.json  .env.example
└── DEEPLINK_EXTERNAL_SETUP.md
```

**There is deliberately no `app/page.tsx`.** `app.esporta.site` exists to serve
deep links, and a bare origin is not one — so `/` is a 404, rendered by
`not-found.tsx`. Everything except the four link routes, `/.well-known/`,
`/robots.txt` and the two `public/` assets is a 404 on this host.

Plus one change outside this folder: **`esporta-backend/src/public/`** — the
unauthenticated preview endpoint the fallback pages read. See §7.

---

## 2. The URLs

| URL | Serves |
|---|---|
| `https://app.esporta.site/.well-known/assetlinks.json` | Android association |
| `https://app.esporta.site/.well-known/apple-app-site-association` | iOS association |
| `https://app.esporta.site/p/<postId>` | post — app if installed, preview otherwise |
| `https://app.esporta.site/s/<shortId>` | short |
| `https://app.esporta.site/pp/<personalProfileId>` | personal profile |
| `https://app.esporta.site/op/<otherProfileId>` | team, organiser, news page |
| `https://app.esporta.site/` | **404** — no landing page, on purpose |

Non-negotiables:

* The Apple file has **no** `.json` extension. `apple-app-site-association.json`
  is a different URL and iOS will not read it.
* Both association files live under `/.well-known/`, never under `/p/`, `/s/`,
  `/pp/` or `/op/`.
* **Nothing redirects.** No route here rewrites or 301s a canonical URL. The URL a
  link was shared as is the URL that stays in the address bar, because that is the
  string the OS matches next time the same link is tapped with the app installed.

---

## 3. How the fallback behaves

**When the app is installed and the domain is verified, none of these pages are
ever rendered** — Android App Links and iOS Universal Links intercept the URL at
the OS level before a browser is involved. Everything below is the *other* case.

* **Live resource** → the preview renders: author, media thumbnail, caption and
  counts for a post; avatar, cover, role/category, bio and followers for a
  profile. Full OpenGraph and Twitter card metadata is emitted server-side, so
  pasting a link into WhatsApp, Discord, Slack or X produces a real preview card
  rather than a bare URL. HTTP 200.
* **Dead resource** → `src/app/not-found.tsx`, HTTP **404**, `noindex`. This one
  page answers three different situations, and its wording deliberately does not
  say which: a nonexistent or mangled id, a deleted post or closed account, and a
  post that exists but is followers-only or team-only. Confirming that a private
  post exists would leak what its author chose not to share, so the backend
  answers an identical 404 for all three and this page keeps that promise.
* **Preview API unreachable** → a generic "open this in Esporta" card, HTTP
  **200**, `noindex`. Explicitly *not* a 404: a shared link is not broken because
  the API had a bad minute, and a 404 would let a chat client cache "not found" as
  the preview everyone sees afterwards.
* **Wrong prefix** → still renders. As in the app, the path segment is a hint, not
  a fact: `/pp/<team-id>` resolves and emits `/op/<team-id>` as its `canonical` and
  `og:url`. The visited URL is left alone.

**The CTA does not try to open the app.** No custom scheme, no `intent://`, no JS
redirect. Anyone reading the page has already been shown not to have the app (or
to be on a client that bypassed the association), and firing a scheme at them
produces an "unknown address" interstitial or a redirect loop. It would also need
an app-side intent filter that does not exist yet (§6). The primary button goes to
Google Play; iOS shows an inert "coming soon" chip until a listing exists.

No user agent is inspected anywhere — sniffing would make every response
uncacheable to save a visitor one glance, so both platforms are always offered.

**Page chrome is the Esporta wordmark and nothing else.** `public/esporta_text_logo.png`
sits above the card; there is no text lockup, no footer and no link to the origin,
because the origin is a 404. The favicon is `public/favicon.ico`, declared in
`layout.tsx` metadata rather than left to the browser's root-path convention.
Both are copies of the assets already used by `core-admin` and the Flutter app.

---

## 4. Identifiers discovered in the repository

| Value | Result | Where it came from |
|---|---|---|
| Android application id | `com.esporta.esporta` | `android/app/build.gradle.kts:33` (`applicationId`), `:9` (`namespace`) |
| iOS Bundle ID | `com.esporta.esporta` | `ios/Runner.xcodeproj/project.pbxproj`, `PRODUCT_BUNDLE_IDENTIFIER` at lines 371 / 550 / 572 |
| Android release SHA-256 | **placeholder — must be supplied** | §5 |
| Apple Team ID | **placeholder — must be supplied** | §6 |

`com.esporta.esporta.RunnerTests` also appears in `project.pbxproj`. That is the
unit-test bundle and must not be used in the association file.

---

## 5. Android SHA-256 status — ⚠️ placeholder

`public/.well-known/assetlinks.json` carries the literal string
`<REPLACE_WITH_REAL_ANDROID_SHA256>`. It could not be resolved from the repository:

| Fact | Detail |
|---|---|
| Release builds are not signed with a release key yet | `android/app/build.gradle.kts:56` → `signingConfig = signingConfigs.getByName("debug")`, beside its own `TODO` |
| A keystore file exists | `Esporta-release-key.jks` at the repository root |
| Its fingerprint is not readable | No `android/key.properties` and no store password anywhere in the repo. `keytool -list` on it fails with `keystore password was incorrect`, and guessing a keystore password is not acceptable. |
| Gradle does not reference that keystore | Nothing under `android/` reads it |

### The correct production value

**If Esporta ships through Google Play — the expected case — the production
SHA-256 is the Play App Signing certificate, not the upload key and never a debug
key.** Google re-signs every install artifact with its own key, so an App Link
verified against the upload certificate fails on every Play install.

Play Console → your app → **Release → Setup → App signing → App signing key
certificate → SHA-256 certificate fingerprint**. That page also renders a
ready-made `assetlinks.json`; copying the fingerprint from there is the
least error-prone route.

### The other fingerprints, and when each applies

* **Upload key** (`Esporta-release-key.jks`) — only needed in `assetlinks.json` if
  a build signed by *that* key is installed directly (non-Play distribution):

  ```bash
  keytool -list -v -alias <alias> -keystore Esporta-release-key.jks
  ```

  Never put the keystore password in this repository.

* **Local debug certificate** — this development machine's
  `~/.android/debug.keystore`, alias `androiddebugkey`, password `android` (the
  SDK's public, well-known debug password — not a secret):

  ```
  E1:46:DF:0D:29:13:FC:FD:03:0E:14:C0:5B:AE:E6:1C:64:8E:9A:EE:83:56:06:E2:F9:73:65:0B:C7:A6:E5:19
  ```

  A **debug** value, deliberately not in `assetlinks.json`. Because the release
  build type currently signs with the debug config, a `flutter run --release`
  build on this machine carries it too — so to test auto-verification before the
  Play key exists, add it as a second array element temporarily and remove it
  before production. It differs per machine.

### More than one certificate

`sha256_cert_fingerprints` is an array. Extra certificates are extra strings in
that **one** array — never a duplicated target object, and never another app:

```json
"sha256_cert_fingerprints": [
  "AA:BB:…  (Play App Signing)",
  "CC:DD:…  (upload key, direct-APK installs only)"
]
```

Format: uppercase hex, colon-separated, 32 bytes / 95 characters.

---

## 6. Apple Team ID status — ⚠️ placeholder

`public/.well-known/apple-app-site-association` carries
`<REPLACE_WITH_REAL_APPLE_TEAM_ID>.com.esporta.esporta`.

The Team ID is genuinely absent from the repository: `project.pbxproj` has no
`DEVELOPMENT_TEAM` key at all (`CODE_SIGN_STYLE = Automatic`, no team recorded),
and there is no entitlements file or `ExportOptions.plist`. It was not guessed.

developer.apple.com → Account → **Membership details → Team ID** (10 characters,
e.g. `A1B2C3D4E5`), or Xcode → target Runner → Signing & Capabilities → Team.

Substitute it so `appIDs[0]` reads exactly `TEAMID.com.esporta.esporta` — one dot,
no spaces, nothing appended.

### App-side work still missing (outside this folder)

Deep links will not open the app until these exist. They belong to the Flutter
workstream and were deliberately not done here:

1. **Android** — `android/app/src/main/AndroidManifest.xml` has no App Links
   intent filter: no `android:autoVerify="true"`, no
   `android.intent.action.VIEW`, no `android.intent.category.BROWSABLE`, no
   `<data android:host="app.esporta.site"/>`. Without it `assetlinks.json`
   verifies nothing.
2. **iOS** — no `.entitlements` file and no `CODE_SIGN_ENTITLEMENTS` setting, so
   the **Associated Domains** capability (`applinks:app.esporta.site`) is absent.
   Without it the AASA file is never fetched.
3. **Release signing** — wire a real release `signingConfig` (§5).

The Dart side is already in place: `kEsportaLinkHost = 'app.esporta.site'`, kinds
`p` / `s` / `pp` / `op`, and the `app_links` plugin is registered on both
platforms.

---

## 7. The preview endpoint (`esporta-backend`)

The fallback pages have no session to read with, so they call one new
unauthenticated route:

```
GET /api/v1/public/preview/:kind/:id     kind ∈ p | s | pp | op
```

Added as `esporta-backend/src/public/` (`PublicModule`, registered in
`app.module.ts`). It returns a normalised preview object — `kind`, canonical
`path`, `title`, `description`, `image`, plus a `post` or `profile` block.

**Security posture**, since `@Public()` switches off the global JWT guard:

* Every read goes through `SupabaseService.anon()` — the `anon` Postgres role. RLS
  decides what exists, so the endpoint cannot see more than a signed-out phone
  could: `posts` only where `visibility = 'public'` and `deleted_at is null`,
  `identities` only where `status <> 'deleted'`, and `media` only for a post it can
  already see.
* The projection is preview-only and hand-written. It is deliberately narrower
  than `PostsService.POST_COLUMNS` — no recruitment embed, no storage paths — and
  must not grow into a general read API.
* Anything `anon` cannot see returns the same 404 as a nonexistent id.
* Plain GET, no side effects, no input but a UUID. A malformed UUID is treated as
  a dead link (404), not a 400.

**It is not rate limited.** There is no throttler in the service. The practical
ceiling is caching: the route sends
`Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=600` so
Vercel answers repeats at the edge, and the site revalidates its own render every
300s (`PREVIEW_REVALIDATE_SECONDS`). Normal traffic therefore reaches Postgres
about once per resource per minute. A deliberate flood would still land on
Postgres — if that matters, add `@nestjs/throttler` to the backend or a rate rule
in front of it. Called out rather than silently assumed safe.

---

## 8. Expected HTTP behaviour

Both association files, over **HTTPS** with a valid certificate, must:

* return **HTTP 200** — not 301/302/307/308 and not via any redirect chain.
  Neither Android's verifier nor Apple's CDN follows redirects for these files, and
  an `http:`→`https:` or apex→`www` hop counts as one.
* need **no** authentication, cookie, session or signed URL.
* be **static JSON** — never an HTML page, a login wall or a JS-rendered shell.
* not be blocked by auth middleware, a WAF, geo-fencing, Basic-Auth preview
  protection or `robots.txt`.

| URL | Expected `Content-Type` |
|---|---|
| `/.well-known/assetlinks.json` | `application/json` |
| `/.well-known/apple-app-site-association` | `application/json` |

Both are forced in `next.config.ts` → `headers()`. The Apple file has no
extension, so every host that guesses a MIME type from the filename gets it wrong
(usually `application/octet-stream`) and iOS then rejects the file. `assetlinks.json`
gets the header too rather than trusting the extension.

Two traps this project already avoids, worth keeping avoided:

* **Dot-prefixed directories being dropped from the build output.** The files live
  in `public/.well-known/`, which Next copies to the deployment root verbatim.
  `verify.sh` fails if they drift back to the project root.
* **A catch-all SPA rewrite answering `/.well-known/*` with HTML and a 200.** The
  four link routes are real App Router directories, not rewrites to one shell, and
  `next.config.ts` contains no `rewrites()` at all. Do not add one.

---

## 9. Deployment

`app.esporta.site` is its own Vercel project, separate from `esporta-backend` and
`core-admin`.

**Project settings**

| Setting | Value |
|---|---|
| Root Directory | `esporta-deeplinking` |
| Framework Preset | Next.js (auto-detected) |
| Build Command | default (`next build`) |
| Output Directory | leave unset |
| Domain | `app.esporta.site` |

**Environment variables** (from `.env.example`; none is a secret)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://app.esporta.site` |
| `ESPORTA_API_BASE_URL` | the esporta-backend origin **including** `/api/v1` |
| `NEXT_PUBLIC_PLAY_STORE_URL` | optional; defaults to the `com.esporta.esporta` listing |
| `NEXT_PUBLIC_APP_STORE_URL` | leave empty until the iOS listing exists |

`NEXT_PUBLIC_SITE_URL` is inlined at build time and is what `og:url` and
`canonical` are built from — if it is wrong or missing, every link preview points
at the wrong origin. `ESPORTA_API_BASE_URL` is read at request time and never
reaches the browser bundle.

**DNS** — point `app` at Vercel per its domain instructions. Note that as of
writing, `esporta.site` does not resolve at all, so none of this is live yet and
none of it has been verified over HTTPS.

**Local development**

```bash
cp .env.example .env.local        # set ESPORTA_API_BASE_URL to your backend
npm install
npm run dev                       # http://localhost:3200
```

On this development machine (Termux, android/arm64) Turbopack cannot run — its
native bindings do not exist for the platform, and Next.js says so explicitly.
Use the webpack fallbacks locally; the default scripts stay Turbopack because
that is the right choice on Vercel:

```bash
npm run build:webpack
npm run dev:webpack
```

---

## 10. How to verify

**Offline, against this repository** — structure, required values, placeholders,
and that all four routes exist:

```bash
bash verify.sh
```

**Against a deployment** — association files, brand assets, that `/` is a 404,
that dead links 404, and (with real ids) that previews actually render with OG
tags:

```bash
python3 scripts/check-site.py https://app.esporta.site

# richer: prove live previews render, not just that 404s work
ESPORTA_POST_ID=… ESPORTA_SHORT_ID=… ESPORTA_PERSONAL_ID=… ESPORTA_TEAM_ID=… \
  python3 scripts/check-site.py https://app.esporta.site
```

**Third-party verifiers**

```
# what Android's verifier actually consults
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://app.esporta.site&relation=delegate_permission/common.handle_all_urls

# what iOS devices fetch through (may lag the first publish)
https://app-site-association.cdn-apple.com/a/v1/app.esporta.site
```

A healthy Google answer lists the `com.esporta.esporta` statement with an empty
error section.

**On-device Android** (after the manifest intent filter from §6 exists)

```bash
adb shell pm get-app-links com.esporta.esporta      # expect: app.esporta.site: verified
adb shell am start -a android.intent.action.VIEW -d "https://app.esporta.site/p/test"
```

Auto-verification runs at install time, so after fixing `assetlinks.json` either
reinstall or force a re-check:

```bash
adb shell pm verify-app-links --re-verify com.esporta.esporta
```

**On-device iOS** — install a build with Associated Domains, then tap a
`https://app.esporta.site/p/<id>` link from Notes or Messages, not from Safari's
address bar, which does not trigger Universal Links. During development
`applinks:app.esporta.site?mode=developer` plus *Settings → Developer → Associated
Domains Development* bypasses Apple's CDN cache.

**Link preview cards** — paste a `/p/<id>` URL into the platform itself
(WhatsApp, Discord, Slack, X). Facebook's Sharing Debugger and X's Card Validator
are the usual scrape-and-recheck tools when a card looks wrong.

---

## 11. What still needs a human

1. `<REPLACE_WITH_REAL_ANDROID_SHA256>` in `public/.well-known/assetlinks.json` (§5).
2. `<REPLACE_WITH_REAL_APPLE_TEAM_ID>` in `public/.well-known/apple-app-site-association` (§6).
3. Register `esporta.site`, create `app`, deploy this project, point DNS at it (§9).
4. Set `ESPORTA_API_BASE_URL` to the deployed backend origin, and redeploy the
   backend so `/api/v1/public/preview/...` exists in production (§7).
5. `NEXT_PUBLIC_APP_STORE_URL` once the iOS listing exists.
6. The three app-side gaps in §6 — Android intent filter, iOS Associated Domains,
   real release signing. Without them the association files verify nothing.

---

## Security note

Nothing in this folder contains a private key, password, API secret or token, and
nothing should be added that does. A SHA-256 **certificate fingerprint** is public
by design — `assetlinks.json` exists to publish it — but the keystore
(`Esporta-release-key.jks`) and its password are not, and must never enter this
folder or any repository. The repository root is not a git working tree, so that
keystore is currently untracked; keep it that way, and make sure any future
`git init` here ignores `*.jks` at the root (the existing rule in
`android/.gitignore` only covers `android/`).
