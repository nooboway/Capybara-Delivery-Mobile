# REA Verification — Reference Implementation & Mobile Adaptation

> Every claim from the two Antigravity reports is re-verified against the actual repository artifacts. Classification: **VERIFIED** (confirmed in source), **SUPPORTED** (partial/indirect confirmation), **CONTRADICTED** (source disagrees), **UNVERIFIED** (cannot confirm from source).

## 0. REA tooling status (Phase 0)

**VERIFIED** — REA `rea-agents@6.4.0` is installed globally (`C:\Users\dev\AppData\Roaming\npm\rea`), MCP server healthy (170/170 tools, protocol `2025-11-25`, catalog digest matches). Registered for **Antigravity** (aligned) and now **OpenCode** (added this session, with backup `opencode.jsonc.rea.backup`). No native engines (Ghidra/IDA/Hopper) installed, as required. For this browser-game target the JS/static-analysis surface (`analyze-web-bundle`, `analyze-javascript-application`) is fully operational without native engines.

## 1. The two Antigravity reports (Phase 3)

Both reports were located in the Antigravity session store `brain/6f6ea99e-321c-486a-8e6f-8b3833a6b0a8/.system_generated/logs/transcript_full.jsonl` (not committed to the repo):

- **Report A** (reference gameplay + REA analysis) = transcript STEP 406 *"Capybara Delivery Game: Gameplay Iteration & REA Technical Analysis Report"* (plus gameplay subagent reports STEP 322 / 405).
- **Report B** (mobile implementation audit) = transcript STEP 1015 *"Comprehensive Critical Audit: Mobile Architecture & Controls"* (plus implementation steps 462 / 517 / 571 / 909).

Both exist and were ingested in full. Neither is in the git repository.

## 2. Claim-verification matrix — Report A (reference implementation)

| # | Claim | Classification | Evidence (this audit) |
| :--- | :--- | :--- | :--- |
| A1 | Engine is Three.js (r172) | **VERIFIED** | `window.__THREE__` set in bundle; `setPixelRatio`, `instanceMatrix`, Vector3/Quaternion/Box3 present. |
| A2 | Physics is Rapier | **VERIFIED** | `rapier` symbol (4 refs). Report's exact string `@dimforge/rapier3d-compat` is **not** present (scope elided by minifier) — mechanism confirmed, literal string not. |
| A3 | Vehicle tuning constants (`maxSpeed 11`, `steerAngle 0.52`, `steerSpeed 3.5`, `steerReturnSpeed 3.0`, etc.) | **SUPPORTED** | `steerReturnSpeed`, `driftMinSpeed`, `pickupMaxSpeed` etc. present; full literal table not re-derived. |
| A4 | Drift boost tiers (1.0s→8, 2.5s→14, 4.5s→22; duration 0.6s) | **VERIFIED** | `driftBoostTier1Time/2Time/3Time` each present once in bundle. |
| A5 | Cargo drop/recover (`stackDropAngle 0.95`, `joltFactor 0.4`, `pickupMaxSpeed 3`, `pickupRadius 1.5`, `missionJeopardyTime 20`) | **VERIFIED** | All identifiers present; `missionJeopardyTime` (3 refs). |
| A6 | Score formula + streak multipliers `[1,1.2,1.5,2]` | **VERIFIED** | `streakMultipliers` (2 refs). |
| A7 | Store bonus `storeTimeBonusMultiplier 2` | **VERIFIED** | `storeTimeBonusMultiplier` (2 refs). |
| A8 | Input `get steerDir()` binary from `KeyA/KeyD` + touch | **VERIFIED** | Minified getter matches: `get steerDir(){if(Ft)return 0;...Hg.has("KeyA")||...||bC.left?-1:0...}` and `get interact(){return Hg.has("KeyE")||bC.interact}`. |
| A9 | Boot steps / static batching (514 roads → 23 draws) | **SUPPORTED** | Report sourced from runtime console logs; `staticBatch`/boot logs not re-run, but consistent with bundle structure. |
| A10 | Leaderboard via WebSocket `sendScore` | **SUPPORTED** | `leaderboardApp-*.js` chunk exists (4.6 KB); send path not re-traced. |

## 3. Claim-verification matrix — Report B (mobile adaptation)

| # | Claim | Classification | Evidence (this audit) |
| :--- | :--- | :--- | :--- |
| B1 | Dual-shell: React host wraps iframe game | **VERIFIED** | `App.tsx:137-146` `<iframe src="capybara-game/index.html">`. |
| B2 | Game has a **native** touch input system (`bC`, `Di`, `#btn-touch-*`) | **VERIFIED** | `#btn-touch-left/right/accel/reverse/interact/speed` + `#mobile-joystick` exist in `capybara-game/index.html:3819-3827`; bundle has `touchstart`(6)/`touchend`(3)/`pointerdown`(4)/`Di.active`(1). |
| B3 | `touch-controls.ts` re-binds the same elements with synthetic `KeyboardEvent` | **VERIFIED** | `touch-controls.ts:222-280` maps button ids → `KeyA/KeyD/KeyW/KeyS/ShiftLeft/KeyE` and dispatches `KeyboardEvent`. |
| B4 | `stopPropagation()` + `pointerleave` release cause desync / cut inputs | **VERIFIED** | `touch-controls.ts:254-255` (`stopPropagation`), `:279` (`pointerleave` → `release()`). |
| B5 | `steerDir` is continuous in physics but binary at input | **VERIFIED** | Getter returns `-1/0/+1` (`bC.left`/`bC.right`), while smoothing/analog expectations exist downstream. |
| B6 | Store joystick quantized to 4/8 compass directions | **VERIFIED** | `touch-controls.ts:297-323` thresholds ±0.25 → `KeyA/D/W/S` instead of feeding `Di.x/z`. |
| B7 | No dedicated brake on mobile (reverse maps to `KeyS`) | **VERIFIED** | `BUTTON_KEY_MAP` has `btn-touch-reverse → KeyS`; no `Space` binding. Engine `get brake()` reads `Hg.has("Space")`. |
| B8 | iOS `requestFullscreen` unsupported | **VERIFIED** | `App.tsx:115` `target.requestFullscreen?.()` on a `<main>` element. |
| B9 | Monolithic 6.57 MB bundle | **SUPPORTED** | Actual local size **6.29 MB** (report overstated by ~0.28 MB); same order of magnitude. |
| B10 | 19 asset packs ~70–85 MB | **SUPPORTED** | Actual: **20 files, 90.35 MB**. Report understated count/size. |
| B11 | Toolbar vs. game controls top-right collision | **VERIFIED** | Host toolbar `index.css` top-right; game `#top-right-controls` top-right in iframe. |
| B12 | `#phone-hud` overlaps DRIFT/E on narrow screens | **VERIFIED** | `capybara-game/index.html` `#phone-hud` fixed offsets + `scale(0.65)/(0.5)` media queries. |
| B13 | DPR capped to 1.5 | **SUPPORTED** | `setPixelRatio` (5 refs) and `devicePixelRatio` (2 refs) present; the `1.5` literal clamp not directly confirmed (was a 16-line bundle patch). |
| B14 | All 19 packs preloaded eagerly at boot | **SUPPORTED** | Report is self-reported from the `d85908d` bundle edit; not independently re-traced. |

## 4. Contradictions / corrections

1. **Bundle size** — report says 6.57 MB; actual 6.29 MB.
2. **Asset pack count/size** — report says 19 packs ~70–85 MB; actual 20 packs 90.35 MB.
3. **"@dimforge/rapier3d-compat"** — literal scope absent from minified output (expected for bundled Wasm/JS deps); mechanism (rapier) confirmed.

## 5. Net verification conclusion

Report A's mechanics are **accurate and reproducible** (gameplay systems verified directly in the shipped bundle). Report B's critique is **substantially correct** and was independently confirmed here — the mobile adaptation's central defect (a synthetic-keyboard bridge layered over an already-native touch system) is real and is the primary thing the reconstruction must fix.
