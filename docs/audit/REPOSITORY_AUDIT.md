# Repository Audit — Okada (Capybara-Delivery-Mobile)

> Independent, evidence-based audit. Facts are labelled **VERIFIED** (read from source), **SUPPORTED** (inferred from source + transcript), or **RECOMMENDATION** (opinion). No production code was modified.

## 1. Repository condition

**VERIFIED** — `C:\Users\dev\Documents\Okada` is an NTFS junction to `C:\Users\dev\.gemini\antigravity-ide\scratch\Capybara-Delivery-Mobile`. The physical repository is under the Antigravity scratch tree.

- Git: clean working tree, branch `main`, HEAD = `d85908d`, in sync with `origin/main` (`github.com/nooboway/Capybara-Delivery-Mobile`).
- 235 tracked files, including **20 binary asset packs (`public/p/*.bin`) totalling ~90.35 MB committed directly to git** (not LFS). Working tree is ~92.6 MB loose objects.
- Stack: pnpm workspaces, Node 24, TypeScript 5.9, Vite 7, React 19, Express 5.

## 2. Workspace layout

| Path | Role | Verdict |
| :--- | :--- | :--- |
| `artifacts/capybara-delivery/` | React + Vite shell that embeds the game in an `<iframe>` | **Core (to be refactored)** |
| `artifacts/capybara-delivery/public/capybara-game/index.html` | The actual game (3835-line HTML: DOM/HUD + CSS) | **Essential — game lives here** |
| `artifacts/capybara-delivery/public/assets/main-CSpZwCDB.js` | 6.29 MB minified Three.js + Rapier game bundle | **Essential — closed bundle** |
| `artifacts/capybara-delivery/public/assets/{music,maps,leaderboard,capyMessage}App-*.js` | Code-split app chunks (audio, minimap, leaderboard, chat) | **Essential (part of game)** |
| `artifacts/capybara-delivery/public/p/*.bin` (20 files) | Asset packs (~90 MB) | **Essential** |
| `artifacts/capybara-delivery/public/capybara-game/asset-proxy.js` | `fetch` interceptor for `/p/*.bin` (local → API fallback) | Reusable (concept) |
| `artifacts/capybara-delivery/src/App.tsx` | React host: iframe + toolbar + mobile modal | **Replace** |
| `artifacts/capybara-delivery/src/lib/touch-controls.ts` | Synthetic-keyboard touch bridge | **Replace** (root cause of input bugs) |
| `artifacts/api-server/` | Express 5 server; `/api/game-assets/:file` asset mirror + object storage + upstream proxy | **Redundant for static prod** (dev-only) |
| `artifacts/mockup-sandbox/` | shadcn/ui mockup sandbox (Replit template leftover) | **Remove** |
| `lib/api-client-react`, `lib/api-spec`, `lib/api-zod`, `lib/db` | Orval/Zod/Drizzle generated scaffolding | **Remove** (unused by game) |
| `scripts/` | `hello.ts` placeholder + post-merge hook | **Remove** |

## 3. What actually renders the game

**VERIFIED** — `App.tsx:137-146` embeds `<iframe src="capybara-game/index.html">`. The game is a self-contained Three.js (r172) + Rapier (`rapier` symbols present, 4 references) WebGL application with a DOM-based HUD. The React layer contributes only the toolbar, the fullscreen button, the mobile modal, and the injected `touch-controls.ts`.

**SUPPORTED** — The engine exposes global handles on `window`/`globalThis`:
- `window.__capyGame` (main game instance: renderer, controller, state)
- `window.__capyAudio` (audio manager — already used by `touch-controls.ts:257`)
- `window.__THREE__` (Three.js namespace)
- `globalThis.__capyDayNight` (read/write day-night progress)

This is material for the architecture decision: the engine already has an integration surface that does not require keyboard-event synthesis.

## 4. Component classification

1. **Essential** — `capybara-game/index.html`, `main-CSpZwCDB.js`, the 4 app chunks, `/p/*.bin`, fonts.
2. **Reusable** — the asset-proxy pattern; the native in-engine touch input (`#mobile-controls`, `#mobile-joystick`, `bC`/`Di` state); the `__capyGame` global.
3. **Redundant** — `touch-controls.ts` (re-implements what the engine already does); the API asset mirror (static hosting makes it unnecessary); the whole `lib/` and `mockup-sandbox/` scaffolding.
4. **Incorrectly implemented** — `touch-controls.ts` synthetic-keyboard bridge; fullscreen on iOS; store joystick quantization; missing brake mapping; `pointerleave` release.
5. **Unnecessary for the game** — ~30 unused shadcn/Radix/Recharts/framer-motion dependencies declared in `artifacts/capybara-delivery/package.json` (the shell only uses `react`, `wouter`, `@tanstack/react-query`, `lucide-react`).
6. **Candidates for replacement** — the React shell/iframe, the input bridge, the build/deploy config.

## 5. Unresolved questions carried forward

- Are `bC`, `Di`, and `Hg` (input state) reachable via `window.__capyGame`, or are they private to the closure? (Determines whether input integration is a public-API bind or a targeted bundle patch.)
- Full inventory of `window.__capyGame` surface (methods/properties) is not yet enumerated.
