# Ryder external link audit — Phase 2F

Baseline: `a1d4e456b458780793e84f3c65a0ef5ffd78cf1b`. The canonical `main-CSpZwCDB.js` is unchanged (SHA256 `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`). This audit combines bounded static searches of shipped HTML/JavaScript, existing same-hash reverse-engineering evidence, and the Phase 2F production browser run. It does not claim a complete semantic decompilation: the installed REA integration reports registration drift; earlier semantic analysis returned a temporary error.

| UI location | Existing destination | Player-facing | Ryder action |
| --- | --- | --- | --- |
| Menu heart `.capy-support` | `https://buy.stripe.com/dRm14m0u03Zpeol3Gv4Ni00` | YES | REMOVE. No approved Ryder support URL was found. Hide entry and remove href; capture/guard navigation. No invented destination. |
| Menu Stats `.capy-mbtn` | `https://capybara-vibejam26.leocoout.dev/stats` | YES | REPLACE with the parent application's `/stats` shell. Canonical click handler is stopped before it opens a window. No player/session query parameters were attached to this Stats URL. |
| Menu social | `https://x.com/leocooout` | YES | REMOVE visible entry and href. |
| Menu social | `https://www.youtube.com/@CapyBoyDelivery` | YES | REMOVE visible entry and href. |
| Original Portal button | `https://vibejam.cc/portal/2026?username=…&color=…&ref=…` | Historically YES | Existing Phase 2E SHOP handler remains the owner. Product guard additionally prevents external window opening. The original handler's username, helmet color, and host/path reference are not sent by SHOP. |
| Menu sponsor title `#sponsor-title` | Configured HTTPS URL | Optional YES | REMOVE presentation and href. External opening is denied. |
| Phone sponsor app `.app-icon[data-sponsor]` | Configured HTTPS URL | Optional YES | REMOVE presentation; guard configured external opening. |
| World sponsor prompt `#sponsor-prompt` | Configured URL or local `/sponsor?slot=…` | Optional YES | REMOVE presentation. Guard external and local `/sponsor` window opening, including native E handlers that bypass anchors. |
| Embed full-game entry | `/` on current origin | Conditional YES | Same-origin opening permitted; existing wrapper suppression retained. |
| Phone session leaderboard | NetClient `lastLeaderboard` and `NET_LEADERBOARD` | YES when connected | KEEP canonical session-network ranking. Independent of public Stats; no public Stats URL in leaderboard module. Canonical offline hiding is retained. |
| Sponsor configuration | Same-origin `/api/sponsor` | Technical request | Not changed. The Express route can proxy upstream original-game configuration; a static deployment may return 404. This is not a user navigation or Stats request. |
| Required binary game assets | Same-origin `/api/game-assets/:file`; Express fallback to original `/p/:file` | Technical resource | KEEP existing asset delivery. Proxy/fallback is not a promotional player link. No production asset transport change. |
| Legacy analytics sender | Same-origin `POST /api/event` | Technical telemetry, not a navigation | Canonical sender retained unchanged. Disabled by default on localhost; no receiver/proxy is registered in the inspected Express routes or checked-in static Vercel setup. This is not a new Ryder Stats backend or a hardcoded call to the developer's Stats host. |
| Google Fonts | `fonts.googleapis.com`, potentially `fonts.gstatic.com` | Technical resource | KEEP. Observed request origin in local product run: `https://fonts.googleapis.com`; do not infer all font requests completed. |
| Shader attribution comment | Shadertoy link inside shader source | NO | INTERNAL ONLY — KEEP. |

## Evidence and policy

Search scope includes the game HTML, shipped JavaScript and lazy Phone app modules, Ryder source, and the sponsor proxy route. Searches covered original names/domains, anchors, window.open handlers, support/Stats/leaderboard destinations and common profile/donation hosts. No Patreon, Ko-fi, itch.io, GitHub or portfolio destination was found in the searched production HTML/JavaScript/TypeScript. This is a shipped-source/player-flow audit, not a crawl of arbitrary future server-provided content.

Canonical source locations: support URL/click around lines 1971, 2204–2215; social entries around 2193; Stats/Portal handlers around 2318; sponsor UI/opening around 785 and 1394. Phone ranking source is `public/assets/leaderboardApp-jFRwN5VD.js`. Proxy behavior is in `artifacts/api-server/src/routes/gameAssets.ts`. These references describe unchanged shipped artifacts, not new dependencies.

The Ryder product adapter intercepts Stats and external anchor clicks at document capture. It also guards iframe `window.open`: same-origin destinations are allowed except `/sponsor`; external destinations are rejected. This covers optional promotional native-key handlers as well as pointers. It does not intercept fetch, media or WebSocket traffic. Disposal restores the original `window.open` and owned metadata. Future approved external product destinations require an explicit policy update.

`verify-phase2f-product-cleanup.mjs` tests direct/native opening rejection in a fixture, then normal startup → menu → local Stats → Back to Game → Phone → Capy Food → Accept → Close → actual GAS acceleration. It audits surviving DOM hrefs and request/navigation attempts. Support is absent, rather than a dead replacement button. The Phone ranking entry and unchanged module are checked independently; the offline run does not pretend to test a live multiplayer server. Original-developer domains are intercepted and counted before transmission, so any attempted escape fails the audit.

See `docs/ux/evidence/phase2f-product-cleanup.log` for exact results and observed origins. Local test origin has an ephemeral port; deployment uses the Ryder origin instead. No analytics/Stats ingestion or backend was added.

Network limit: the original analytics sender is disabled on localhost, so this run does not prove deployed `/api/event` behavior. Static same-hash evidence shows a same-origin endpoint, a sessionStorage session ID and a bounded memory batch queue; there is no checked-in Stats receiver. Remote hosting overrides and live multiplayer traffic were not audited in this local correction pass. The removed **public Stats navigation**, retained **legacy sender**, and retained **session leaderboard** are three distinct systems.

## Branding and legal classification

REMOVE/REPLACE: original creator cinematic, original project logo/loading art, original menu credit, support/social/public Stats promotion. Creator and VibeJam cinematic parent containers are hidden together, avoiding an empty black title backdrop. Ryder wordmark replaces menu, loading and cinematic logo images. Visible intentional credit is exactly **Remixed by Sylens Studios ™**.

INTERNAL ONLY — KEEP: original names/URLs/localizations remain in the byte-identical canonical bundle, filenames, historical reports and compatibility identifiers. They are not claimed to have been deleted from source bytes. The Phone application name is a retained canonical gameplay identifier, not a public Stats redirect.

LEGAL CREDIT — KEEP: Three.js Authors copyright and MIT/SPDX comments in the canonical artifact (near lines 3–6, 46–49, 421–424) remain intact. No tracked LICENSE/NOTICE/COPYING file was removed. Root package declares MIT, but this alone does not establish rights to every mirrored asset. No evidence established that promotional creator/support/social links are legally required. Upstream asset licensing remains a provenance question; this phase makes no assertion of legal clearance and removes no license notices.
