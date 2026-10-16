# Ryder Phase 2E — native mobile controls final report

**Verdict: READY FOR PHYSICAL RETEST.** All automated gates pass. Physical iPhone Safari acceptance is still required; Phase 3 is not started. No deployment or push was performed.

## Required results

| # | Item | Result |
| --- | --- | --- |
| 1 | Starting SHA | `ed4763f0548e5f5bb28deb113fe1ca66611dd29f` |
| 2 | Final local SHA | The local commit containing this report; obtain with `git log -1 --format=%H -- docs/ux/PHASE_2E_NATIVE_MOBILE_CONTROLS.md`. Exact SHA is supplied in the final response. |
| 3 | Remote pushed | NO; local branch `phase2e-native-controls`; main untouched. |
| 4 | Canonical SHA | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` |
| 5 | Canonical unchanged | YES; hash and Git diff verified. EngineAdapter and R3 policy also unchanged. |
| 6 | Hybrid mobile control path removed | YES; former touch implementation replaced by a compatibility export to RyderMobileControls. |
| 7 | Canonical mobile controls suppressed | YES; reversible scoped CSS and capture guard prevent native gameplay touch acquisition. Keyboard remains native. |
| 8 | Ryder native control root | `#okada-phase1-controls-root[data-ryder-controls=native]`; Ryder-owned presentation and pointers. |
| 9 | Centralized layout configuration | `mobile/layout.ts`, normalized anchors with clamped target dimensions; separate store ACTION/HUD positions. |
| 10 | Viewport strategy | visualViewport dimensions/offsets, iframe fallback; resize, scroll and orientation recalculation. |
| 11 | Safe-area handling | Local env insets plus parent-document probe converted into iframe coordinates without double-padding; tested with 44/44/21 physical-inset fixture. |
| 12 | Menu visibility | Gameplay controls hidden and inert before Play and during Menu confirmation. |
| 13 | World visibility | WORLD controls require a live, bound current generation and tutorial eligibility. |
| 14 | Store visibility | Full XY stick and ACTION; driving actions hidden. HUD upper left, ACTION lower right, clear of shopping list/timer; actual hit tests PASS. |
| 15 | Phone visibility | Gameplay targets hidden/inert, all owners released; shared Close/Menu/Mute remain usable. |
| 16 | Disconnected visibility | Hidden/inert; no acquisition or visible dead-control fallback. |
| 17 | Live-binding invariant | Bound, undisposed current generation and exact adapter input identity with `world._lastInput`; checked before gestures and during UI refresh. |
| 18 | Timeout/dead-control prevention | Inert startup presentation; existing cancellable 250 ms readiness polling has no elapsed-time abandonment; reload disposes old generation. |
| 19 | Floating joystick | One shared component, dynamic thumb origin, exclusive pointer, 60 px circular visual gate, disappears on release. |
| 20 | World steer result | PASS; fractional X intent reaches canonical consumer; actual yaw changes with displacement. Y never generates pedals. Deadzone .04, linear response, no added smoothing. |
| 21 | Store walk result | PASS; continuous diagonal movement and neutral release with canonical/R3 stopping. Radial deadzone .18, radius 60 px. |
| 22 | GAS actual bike response | PASS; canonical forward plus measured forward speed > .5, not just normalized state. Hold only; GAS latch removed. |
| 23 | BRAKE actual bike response | PASS; acquisition trace proves canonical brake, then measured forward speed falls to zero. |
| 24 | REV actual bike response | PASS; held control transitions through existing .15/.4 hysteresis and produces speed < -.5 plus actual reverse displacement. |
| 25 | DRIFT result | PASS; simultaneous steer/GAS/DRIFT reaches canonical shift; partial release preserves other owners. |
| 26 | ACTION result | PASS; trusted touch enters store, acquires cart, collects required items, exits and completes delivery. |
| 27 | Pre-Phone GAS | PASS; returning-player actual acceleration. |
| 28 | Post-Phone GAS | PASS; returning-player and natural first-order actual acceleration with original bound handle. |
| 29 | Pre/Post steering parity | PASS; identical .5 normalized and canonical steering before/after Phone; actual moving steering separately verified. |
| 30 | Phone ownership | PASS; no gameplay hit targets or stale owners while open; close restores neutral live controls. |
| 31 | Capy Food | PASS; trusted landscape tap opens canonical app. |
| 32 | Accept | PASS; trusted Accept creates actual canonical order. |
| 33 | Close | PASS; trusted Close dismisses app-open Phone and preserves original binding. |
| 34 | Full delivery loop | PASS; actual touch-driven road route, cart, all required items, store exit, customer route and incremented delivery count. No spatial/item/completion assignments. |
| 35 | Multitouch steer+GAS | PASS; independent pointer owners, including lifecycle release tests. |
| 36 | steer+GAS+DRIFT | PASS; canonical consumption and actual motorcycle direction/displacement. |
| 37 | iframe reload | PASS on actual React application; old source/owners disposed, generation B initially inert. |
| 38 | orientation reset | PASS in Chromium screen-orientation emulation; portrait blocks, landscape requires fresh input. Physical iPhone rotation remains unverified. |
| 39 | disposal | PASS; idempotent reset, captures/listeners/observer/rAF/timer/probe cleanup and native HUD restoration. |
| 40 | 667x375 | PASS actual eight-target hit audit and screenshot. |
| 41 | 740x360 | PASS actual eight-target hit audit and screenshot. |
| 42 | 780x360 | PASS actual eight-target hit audit and screenshot. |
| 43 | 844x390 | PASS actual eight-target hit audit, store/HUD audit and screenshots. |
| 44 | 896x414 | PASS actual eight-target hit audit and screenshot. |
| 45 | 932x430 | PASS actual eight-target hit audit and screenshot. |
| 46 | Tablet | PASS 1366x1024; larger Android-shaped viewport 1080x480 also PASS. |
| 47 | 1,200 idle frames | PASS actual physics-step count under normal GPU rendering. |
| 48 | 1,200 post-flow frames | PASS actual physics-step count after Accept/Close and lifecycle flow, normal rendering. |
| 49 | Runtime errors | ZERO JavaScript/WASM runtime exceptions in final 62/62 production suite; no Rapier aliasing/unreachable errors. |
| 50 | Phase 1 regression | 40/40 PASS. |
| 51 | R3 regression | 23/23 PASS; production policy preserved unchanged. |
| 52 | Phase 2D regression | 30/30 PASS against final layout. |
| 53 | Phase 2D-R1 regression | 33/33 PASS. |
| 54 | Audio regression | 12/12 PASS; R1 additionally measured silence of playing music and SFX, unmute and persistence across Phone. |
| 55 | Typecheck | Strict input/immersive PASS; full application `pnpm run typecheck` PASS, zero diagnostics. |
| 56 | Build | PASS production Vite build; 1784 modules, existing nonfatal tooltip sourcemap warning. |
| 57 | Screenshots | `docs/ux/screenshots/phase2e/`; all eight sizes, active driving/store stick, Phone, portrait, physical insets, menu confirmation, delivery and reload. Reviewed menu, tablet, store, Phone, portrait and delivery captures. |
| 58 | Docs | This report, `docs/architecture/RYDER_NATIVE_MOBILE_CONTROLS.md`, updated `ENGINE_INPUT_CONTRACT.md`, evidence logs. |
| 59 | Remaining P0 | None demonstrated by completed automated gates; physical acceptance is pending, not inferred. |
| 60 | Remaining P1 | Physical Safari control feel, browser chrome/safe areas, rotation and hardware audio require user retest. No claim of ergonomic acceptance. |
| 61 | Physical device verified | NO; Chromium touch emulation is not physical iPhone Safari evidence. |
| 62 | Recommendation | READY FOR PHYSICAL RETEST. Stop; no Stats/Leaderboards or Phase 3 implementation. |

## Implementation scope

Production changes are limited to the mobile control integration and its existing shell: eight files under `src/lib/input/mobile/`, compatibility `sources/touch.ts`, initializer binding health, normalized numeric drift/interact in the existing manager/types, the narrow tutorial acknowledgement bridge, and removal of the outer iOS install hint on Play. No gameplay engine, physics, mission, scoring, store-policy, adapter or production configuration changes were made.

The tutorial bridge preserves canonical locks and transitions. Trusted Ryder Phone/driving gestures acknowledge the same canonical tutorial steps that previously recognized native button IDs. It never clears locks directly, calls tutorial.complete(), emits keyboard events, or advances unrelated states.

A trusted Menu pointerup changes the DOM before the browser's later compatibility click. A reproduced retargeted click hit the newly opened modal backdrop and closed it. The integration now consumes that one matching trusted compatibility click; a fresh pointerdown clears the guard, and keyboard activation remains available. The 24/24 lifecycle suite includes this regression.

## Verification and evidence

All commands run from the repository root, except the package's build/typecheck commands as indicated. Browser tests use installed Chrome with normal GPU rendering. `PW_TEST_SCREENSHOT_NO_FONTS_READY=1` skips Playwright's external-font readiness wait for screenshots only; it does not alter application source, input, simulation or rendering. Regression captures use `RYDER_SCREENSHOT_DIR=docs/ux/screenshots/phase2e/regressions` to preserve historical screenshots.

| Command | Result | Evidence under docs/ux/evidence |
| --- | --- | --- |
| `node artifacts/capybara-delivery/scripts/verify-phase2e-native-controls.mjs` (no profile or route-only flags) | 62/62, exit 0 | `phase2e-native-controls.log` |
| `node artifacts/capybara-delivery/scripts/verify-phase2e-layout.mjs` | 41/41 | `phase2e-layout.log` |
| `node artifacts/capybara-delivery/scripts/verify-phase2e-lifecycle.mjs` | 24/24 | `phase2e-lifecycle.log` |
| `node artifacts/capybara-delivery/scripts/verify-engine.mjs` | 40/40 | `phase2e-phase1.log` |
| `node artifacts/capybara-delivery/scripts/test_store_motion_policy.mjs` | 23/23 | `phase2e-r3.log` |
| `node artifacts/capybara-delivery/scripts/verify-phase2d.mjs` | 30/30 | `phase2e-phase2d.log` |
| `node artifacts/capybara-delivery/scripts/verify-phase2d-r1.mjs` | 33/33 | `phase2e-r1.log` |
| `node artifacts/capybara-delivery/scripts/verify-ryder-audio.mjs` | 12/12 | `phase2e-audio.log` |
| `node artifacts/capybara-delivery/scripts/verify-input-startup.mjs` | 8/8 | `phase2e-startup.log` |
| `node artifacts/capybara-delivery/scripts/verify-tutorial-bridge.mjs` | 9/9 | `phase2e-tutorial.log` |
| Strict tsc on `input/index.ts` and `immersive.ts`, ES2022/DOM, bundler resolution | exit 0 | `phase2e-input-typecheck.log` |
| `pnpm --dir artifacts/capybara-delivery run typecheck` | exit 0 | `phase2e-full-app-typecheck.log` |
| `pnpm --dir artifacts/capybara-delivery run build` | exit 0 | `phase2e-build.log` |

The production test serves the actual built React shell and uses its normal iframe initialization. The first-time session follows the actual tutorial with a trusted Skip hold and Phone/order interactions. The returning session seeds only canonical tutorial-completion storage version 2 and uses an explicit Easy-offer scheduling fixture. Temporary binding-health and safe-inset fixtures test failure/layout behavior. Physics-step counters delegate once to the original method. No positions, velocities, required-item lists, collection flags, carts, delivery counts or mission-completion state are assigned by its delivery navigator.

Earlier failed navigator runs were not accepted as passes. Test-only corrections addressed released-point CDP semantics, walking waypoint clearance/stop observation and the budget for a long real customer route. Brake engagement is observed at acquisition, then actual deceleration is checked independently. Pre/post steering parity is checked without driving into a barrier; actual moving steering is a separate assertion. The final complete run contains both session types, all frame checks, actual delivery, disposal and reload.

The historical Phase 1 suite retains its documented spatial/item fixtures; it is not represented as a driven road route. Canonical optional API requests can return 404 in the local offline harness; these are distinct from JavaScript/WASM runtime exceptions. The final production suite reported zero such exceptions.

## Preservation and stop gate

All 31 pre-existing files in the preservation manifest still match their original hashes. Existing modified historical screenshots, earlier diagnostic work and the four Stats audit documents remain outside this commit. No Stats feature, leaderboard implementation, canonical bundle edit, deployment, push or merge was performed.

Physical retest must confirm iPhone Safari: launch, portrait/landscape rotation, controls while driving, Phone/Capy Food/Accept/Close, post-Phone GAS/brake/reverse, store stick/action, delivery and music/SFX mute. Driving feel and hardware/browser behavior remain a human gate. Do not begin Phase 3 before that acceptance.
