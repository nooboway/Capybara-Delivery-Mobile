# Git History — Okada (Capybara-Delivery-Mobile)

> Evidence-based history. All commits verified with `git log` / `git show` / `git ls-remote`.

## 1. Commit timeline

| Hash | Author | Date (UTC) | Subject |
| :--- | :--- | :--- | :--- |
| `0c05d76` | Replit Agent | 2026-09-11 | Initial commit |
| `f7bfda2` | Replit Agent | 2026-10-11 21:35 | Implement game server routes and update dependencies |
| `39259bf` | Replit Agent | 2026-10-12 02:55 | Published your App |
| `15d43c8` | Replit Agent | 2026-10-12 03:10 | Update game assets endpoint and memory documentation |
| `d85908d` | nooboway | 2026-10-12 05:15 | feat(mobile): rebrand to Okada, add local asset packs, and inject mobile touch controls |

**VERIFIED** — commit `d85908d` exists and is HEAD locally and on `origin/main` (`d85908d4b8f9f61ebe3d55cfa74a108e79bd78cf`). The GitHub push reported by Antigravity **did succeed**.

## 2. Original project structure (`0c05d76`)

**VERIFIED** — The initial commit is the standard Replit pnpm-workspace template:
- `artifacts/api-server/` — Express skeleton (app.ts, index.ts, logger, health route).
- `artifacts/mockup-sandbox/` — a shadcn/ui component gallery (60+ UI components) + `mockupPreviewPlugin.ts`.
- `lib/` — Orval-generated API client/Zod schemas + Drizzle DB schema (empty game-domain tables).
- `scripts/`, root `tsconfig`/`pnpm-workspace.yaml`/`replit.md`.

There is **no game code** in the initial commit — the game was a later import.

## 3. Changes introduced by Antigravity (the local agent)

The local agent work is contained in `d85908d` (authored under the user's identity `nooboway <nooboway44@gmail.com>`). Verified file-level changes:

**Rebranding**
- `artifacts/capybara-delivery/index.html` — title/metadata → "Okada - A Game About Animals Delivering Food"; Vibe Jam references removed; "Capywood" → "Lekkiwood".
- `public/capybara-game/index.html` — in-game copy, embed bar, corner badge "⚡ sylens 2026", Lekkiwood landmark sign.

**Mobile input injection**
- Added `src/lib/touch-controls.ts` (377 lines) — synthetic `KeyboardEvent` bridge over the game's native `#btn-touch-*` elements.
- Modified `src/App.tsx` (+152) — toolbar (Mobile / Touch: ON/OFF / Fullscreen), mobile modal with localtunnel URL, `prepareGameFrame()` text swap + style overrides.

**Asset localization**
- Added 20 `.bin` packs (~90 MB) under `public/p/`.
- Modified `public/capybara-game/asset-proxy.js` — fetch interceptor: local `/p/*.bin` → fallback `/api/game-assets/*.bin`.
- Modified `public/assets/main-CSpZwCDB.js` (+16 lines) — boot preload + fade-transition/DPR tweaks.

**Server**
- `15d43c8` added `objectAcl.ts`, `objectStorage.ts`, `mirrorGameAssets.ts`; `gameAssets.ts` proxied to `https://capybara-vibejam26.leocoout.dev`.

**Performance**
- `index.html` — sets `capy.settings.qualityTier = "low"` on touch devices before the iframe boots.
- `main-CSpZwCDB.js` — 240 ms crossfade (was ~960 ms), DPR clamp (`setPixelRatio(min(dpr,1.5))`).

## 4. Breaking / risky changes

- **90 MB of binaries committed to git** — bloats the repo; every clone fetches the full history. **RECOMMENDATION**: move `/p/*.bin` to a CDN/object store or Git LFS.
- **Direct edits to the minified bundle** (`main-CSpZwCDB.js` +16 lines) — not reproducible from source (the game's readable source is not in the repo), and fragile to future upstream updates.
- **Hard-coded localtunnel URL + IP** (`App.tsx:125`, `268-271`) leaked into source — temporary dev relay, non-functional in production and now stale.

## 5. Repo vs. reference

- The reference application (`https://capybara-vibejam26.leocoout.dev`) is the *shipped Vibe Jam build*. A local snapshot exists at `C:\Users\dev\.gemini\antigravity-ide\scratch\capybara_shipped_app` (same hashed asset filenames: `main-CSpZwCDB.js`, `mapsApp-*.js`, etc.).
- The game's readable source is **not** in this repository — only the minified bundle and the DOM/HTML/CSS shell. Memory note `.agents/memory/capybara-game.md` states the user owns the game and is authorized to reproduce it.

## 6. Conclusion

Antigravity's net contribution was: rebrand + asset localization + a **layered** touch bridge + a React toolbar. It did not modify the game's core gameplay (physics, missions, scoring are untouched). The primary architectural debt (dual-shell + competing input layers) was introduced by this commit and must be unwound.
