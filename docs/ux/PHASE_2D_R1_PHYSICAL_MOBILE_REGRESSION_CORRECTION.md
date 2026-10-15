# Ryder Phase 2D-R1 — physical mobile regression correction

Starting checkpoint: `92885c037f80310873373bc784613a901dce99ca`.

Scope: the six outstanding Phone, gameplay-visibility and audio P0s. No Stats/Leaderboards or Phase 3 work. No push. Existing unrelated work and screenshots were preserved separately before editing.

## Findings and corrections

| P0 | Cause | Correction |
| --- | --- | --- |
| Controls visible before gameplay | Touch UI attached before engine input resolution, but had no `body.in-game` gate. Initial unchanged mode also skipped visibility application. | Unconditional initial visibility, observed gameplay state, full descendant suppression, synchronous acquisition guard. Leaving gameplay resets all touch ownership. |
| Phone beside Menu | Fixed right offset assumed a toolbar width. An actual iframe also applies a 36px transformed-body offset. | Align to measured Menu bounds in the controls' containing-block coordinates, with 8px separation; recalculate on resize and toolbar size changes. |
| Phone steals/admits gameplay touches | Suppression did not explicitly cover every descendant or guard synchronous acquisition. Closed native Phone could also cover Brake/Reverse. | Every gameplay descendant becomes hidden and non-hit-testable while Phone is open; clear pointers and GAS lock. Closed native Phone peek is hidden while Ryder controls are attached. |
| Landscape Capy Food | Phone trigger relied on a compatibility click suppressed by canonical touch cancellation; Phone root may remain inline-hidden; generic Phone scaling and fixed child height do not fit a short landscape viewport. Synthetic app clicks concealed hit-testing failures. | Owned pointer gestures plus keyboard activation on Phone/Close; reveal through canonical Phone API; fit the actual screen, accounting for the embedded header, retain full-size icon targets and scrollable content. Test trusted browser touch in an actual iframe. |
| Accept → close → driving | Native `hide()` closes the current app rather than dismissing an app-open Phone; portrait swipe-close does not provide a landscape close affordance. | Separate Phone UI Close button outside the disabled gameplay root, calling canonical `minimize()`. Tests accept a canonical offer through its real button, close, then exercise the actual vehicle. |
| Mute active SFX | Canonical mute zeros music/honk gains, drift and future SFX volume, but detached pooled HTML SFX already playing retained volume 0.6 and `muted=false`. Independently reproduced before correction. | Pre-bootstrap owned audio bridge tracks played HTML media and completes canonical mute using their `muted` flags. Canonical mixer remains authoritative. No second mute click listener, no new audio, no restarts, no volume rewrites. |

## Architecture and preservation

Canonical bundle is unchanged. EngineAdapter, InputManager, R3 store-motion policy, orientation-reset correction, native-joystick suppression, the 360° joystick and the combined Brake/Reverse state machine remain unchanged.

Production changes are confined to `src/lib/input/sources/touch.ts`, the owned `public/capybara-game/ryder-audio.js` bridge, and its pre-bootstrap script reference in `public/capybara-game/index.html`.

The audio bridge retains per-media mute flags, delegates each canonical toggle once, is idempotent on reinjection, retains state during BFCache suspension and restores owned interfaces on final teardown. Its registry lives for the iframe lifetime and tracks the canonical bounded media pools. It does not replace the audio engine.

## Verification method

`verify-phase2d-r1.mjs` uses a real game iframe, normal startup, real input module, mobile Chromium touch emulation, trusted CDP multitouch and touchscreen taps. Tutorial completion, Phone unlock and generation of a real canonical incoming offer are explicitly test setup fixtures; app opening, acceptance, dismissal and driving are user-input paths. Render ratio is reduced only in QA. No production testing hook is added.

Audio verification samples actual post-gain music waveform and an already-playing real HTML SFX through test-only analysers. It requires nonzero output before mute, zero while muted, restored output after unmute, and unchanged playback/source identities. The analyser instrumentation does not add production routing.

`verify-ryder-audio.mjs` covers lifecycle, persisted mute, repeat toggles, detached media and teardown. Existing Phase 2D assertions are retained. Its harness uses normal Chromium rendering, fails on runtime errors and accepts a screenshot-output override to preserve pre-existing screenshots.

## Runtime failure isolation and harness correction

The first trap is inside canonical Rapier world.step. The unsafe-aliasing rbTranslation errors are secondary failures after that trap. The original harness forced Chromium `--disable-gpu`.

The failure does not require Phone, Capy Food, order acceptance, driving, audio verification, gameplay visibility gating or Phone layout observation. A plain idle case fails at 331 frames. Removing all Okada module injection and the Ryder audio script from the served runtime still fails at 376 frames. Those runtime files are therefore not necessary for the failure; there is no evidence supporting a production input workaround.

The same no-integration idle case, changing only the Chromium GPU-disable launch flag, completes 604 frames without an error. Normal rendering then completes the full current production integration for 1,200 idle frames (20,391 ms) plus 1,200 frames after trusted Phone → Capy Food → Accept → Close → driving (20,244 ms), with zero runtime errors and 33/33 assertions passing.

The integration-level correction is to the test harness: use normal Chromium rendering. No engine timestep, physics step, exception handling or production callback is changed. The exact internal Rust assertion behind the forced-GPU-disabled failure is not decoded; the controlled evidence isolates the harness configuration rather than attributing it to a Ryder subsystem.

A second minimal no-integration repeat removes all per-frame state inspection and retains only a count increment after the original physics update returns. It confirms normal gameplay, no injected input and no audio bridge, then reproduces the same trap after 384 completed updates: 150,531 ms observation / 251,832 ms total runtime, 30 collected runtime errors. This proves direct diagnostic physics reads are not necessary. The counter is primitive; the wrapper calls the original step and counts only successful returns.

## Physics access audit

The reduced idle diagnostic reads only numeric fields from JS dynamics and THREE position objects; it does not invoke translation(), rotation(), getPosition(), getDynamics() or collider APIs, retain returned Rapier wrappers, attach analysers, take screenshots or poll physics getters. Its optional counter-only mode removes even those numeric state reads. Playwright polls a primitive counter, not a WASM object/proxy. No diagnostic wraps physics in try/catch.

Brake/Reverse's `readForwardSpeed` runs on press and at the existing held-control polling interval, not continuously during idle. Canonical `_bikeTelemetry.getDynamics` directly returns its JS `rapierDynamics` object without a Rapier getter call. The helper consumes only the finite numeric `forwardSpeed` and returns that primitive; touch does not retain the dynamics object. No Brake/Reverse press occurs in the idle reproduction, and the crash reproduces with the entire input module absent. This reader is not necessary for the observed failure, and it remains unchanged.

New gameplay/Phone observers read body classes, Phone visibility and DOM geometry. They do not read or retain physics objects. Instrumentation saw no watched callback execute inside `_stepPhysics`. No unsafe retained physics object was identified in the new correction code.

The driving proof now atomically captures copied normalized input plus primitive speed when the unchanged >0.01 threshold is met, with a five-second timeout. A fixed 600ms delay and a later reread were frame-rate-sensitive. The canonical threshold, movement and input requirements are preserved. The final observed proof has steer=0.5, throttle=1 and speed=0.011052.

## Results

| Gate | Result |
| --- | --- |
| Phase 2D-R1 strengthened suite | **33/33 PASS**, zero runtime errors. |
| Idle stability | **1,200 completed physics updates PASS**, zero runtime errors. |
| Post-order/driving stability | **1,200 completed physics updates PASS**, zero runtime errors. |
| Audio lifecycle | **12/12 PASS**, exit 0. |
| Strict input typecheck | PASS, exit 0. |
| Existing Phase 2D | **30/30 PASS**, exit 0, zero runtime errors. |
| Production build | PASS, exit 0; 1775 modules, 11.91s. Existing tooltip sourcemap warning is nonfatal. |
| Canonical SHA-256 | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`, unchanged. |
| Physical-device acceptance | NOT RUN; user retest required. |

Production corrections are preserved byte-for-byte from the pre-isolation backup. EngineAdapter, InputManager, canonical bundle and R3 remain unchanged. No Stats/Leaderboards or Phase 3 work. No push.

## Evidence

- `docs/ux/evidence/phase2d-r1-runtime-gate.log`
- `docs/ux/evidence/phase2d-r1-canonical-counter-only.log`
- `docs/ux/evidence/phase2d-r1-reduce-canonical-idle.log`
- `docs/ux/evidence/phase2d-r1-canonical-default-gpu.log`
- `docs/ux/evidence/phase2d-r1-isolation-status.md`
- `docs/ux/evidence/phase2d-r1-phase2d-regressions.log`
- `docs/ux/evidence/phase2d-r1-audio-unit.log`
- `docs/ux/evidence/phase2d-r1-input-typecheck.log`
- `docs/ux/evidence/phase2d-r1-build.log`
- Screenshots: `docs/ux/screenshots/p2d_r1_{menu,hud,phone_home,offer,accept_target,accepted,driving_restored,muted}.png`.

The earlier forced-GPU-disabled and intermediate motion-race logs are historical diagnosis, not final acceptance evidence.

## Physical acceptance gate

Automated mobile emulation is not a physical phone test. Real-device confirmation remains required for Capy Food taps, order acceptance/closing, driving comfort, orientation/fullscreen and audible music/SFX. Do not claim physical UX acceptance until the user retests.
## Final verdict

**READY FOR PHYSICAL RETEST.** All automated closure gates pass. No remaining automated P0. The forced-GPU-disabled canonical failure is preserved as an environment-specific diagnostic limitation; no canonical or production physics workaround was added. All 20 unrelated files match their pre-work backup hashes. The local corrective commit contains this report; no push or Phase 3 work is authorized or performed.
