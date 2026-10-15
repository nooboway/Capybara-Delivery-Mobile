# Phase 2D-R2 — physical retest correction

Starting committed SHA: `6875ab545df46ea972af246399b9e0afc0eacf5c`. This is a mobile correction, NOT Stats implementation. The user physically retested the preview and reported: Phone opens/closes in landscape, but its content requires scrolling; after accepting an order, visible GAS/Brake controls do not work. This feedback does not constitute physical acceptance of the candidate. Phase 3A Stage B remains on hold.

## Proven startup defect

The React shell calls initOkadaInput once when its iframe loads. The input module attached visible touch UI immediately, then gave up resolving canonical world._lastInput after 60 seconds. A player can wait in the menu longer than that, and normal mobile startup itself can take longer. On timeout the provisional UI deliberately remained, but adapter.override was never called and no retry was scheduled. Phone buttons could still work through their separate canonical Phone API while gameplay contributions remained disconnected.

A reproduction served the actual previously built React application, not a handwritten iframe harness. After a long menu wait it logged the exact startup-unavailable error and reached normal gameplay at 145465ms with ready=false. The later baseline offer step timed out on a hidden Accept control; that incomplete replay is not claimed as an end-to-end pre-fix order reproduction. The startup disconnection itself is established by the log, source and failing focused regressions, and matches the user's physical observation.

The previous R1 harness concealed this defect by calling initOkadaInput again after body.in-game appeared. Passing that test did not prove the real one-initialization application path.

## Correction

Input resolution now waits for engine readiness for the lifetime of the current iframe generation, without an arbitrary menu/loading deadline. It polls at the existing 250ms interval. Abort, pagehide and replacement generation cancel polling and clean up provisional UI immediately; cancellation cleanup is idempotent so an old generation cannot remove a replacement's UI. Startup clears provisional held touches before connecting. EngineAdapter, InputManager, canonical getters, physics, R3, joystick and combined Brake/Reverse logic remain unchanged.

The R1 suite now awaits its original pre-game initialization promise, rather than restarting input after Play. A new production-app test serves dist/public and drives the real React iframe after a >60-second menu delay. It never injects an input bundle, initializes input manually or reinitializes it. Tutorial completion, Phone unlock and generation of a real Hard offer are explicit QA fixtures; trusted browser touches open the app, accept, close and drive. It waits for the unlock animation to finish before tapping a moving icon.

## Landscape Phone correction

The existing forced 300px minimum offer height caused the whole card, including its actions, to scroll out of a short viewport. The owned landscape CSS now gives the Phone more width, uses a compact horizontal heading/reward, fits the offer to the available app content, and preserves at least 44px Accept/Skip targets. The actions do not scroll out of the card; only the item list can overflow when necessary. This is not a promise that every possible translated item list fits without any scrolling on every phone.

Actual React-shell Hard-offer measurements: Accept is visible and unobstructed without scrolling the app at 844x390, 780x360 and 667x375. The item list needed 13px overflow at 780x360; the other tested sizes needed none. No card content is hidden merely to achieve the fit.

## Validation

| Check | Result |
| --- | --- |
| Actual production React app, long menu → normal Play → Capy Food → Accept → Close → driving | 12/12 PASS, zero runtime errors, zero startup-unavailable errors |
| Original production initialization after late Play | ready=true; normal gameplay entered at 145727ms |
| Actual post-order movement | throttle=1, steer=0.5, canonical forward=true, forwardSpeed=0.099851 |
| Combined Brake/Reverse after Accept | normalized reverse=1 and canonical backward=true |
| Startup/lifecycle regression | 8/8 PASS, including late readiness, actual getter input, abort, replacement, pagehide and no leftover timers |
| Strengthened R1, no reinitialization workaround | 33/33 PASS, zero runtime errors |
| Idle stability | 1201 completed updates, 20537ms, zero runtime errors |
| Post-order stability | 1200 completed updates, 19983ms, zero runtime errors |
| Existing Phase 2D | 30/30 PASS, zero runtime errors |
| Audio lifecycle | 12/12 PASS |
| Strict input typecheck | PASS |
| Production build | PASS; existing tooltip sourcemap warning remains nonfatal |
| Canonical SHA-256 | C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E, unchanged |

Evidence: `docs/ux/evidence/mobile-retest-{production,startup-unit,r1,phase2d,audio,typecheck,build}.log`. The pre-fix diagnostic and backup remain in the task workspace. New production screenshot: `docs/ux/screenshots/mobile_retest_driving.png`; the R1 screenshot set reflects the compact Phone offer. QA may freeze the offer timer to allow screenshots; that is not a production timer change.

## Scope/status

Production changes: `src/lib/input/index.ts` lifecycle handling and `src/lib/input/sources/touch.ts` landscape CSS only. Tests: corrected `verify-phase2d-r1.mjs`, new `verify-input-startup.mjs` and `verify-mobile-production.mjs`. No canonical bundle, EngineAdapter, InputManager, R3, joystick, Brake/Reverse semantics, audio implementation, Stats/API/database or deployment configuration changes.

Changes remain LOCAL and uncommitted. No push or deployment is performed. The existing phone-test URL still serves 6875ab5, so these corrections cannot be physically accepted until a new preview is explicitly authorized/deployed and tested. The Phase 3A audit documents and unrelated pre-existing work remain preserved. Physical verification of this correction remains pending.

Final local verdict: **READY TO DEPLOY FOR ANOTHER PHYSICAL RETEST**, not physically accepted. All automated gates above pass. The 31 pre-existing dirty/untracked files match the earlier manifest; audit documents remain untouched. No new commit or push. Existing preview still serves 6875ab5.
