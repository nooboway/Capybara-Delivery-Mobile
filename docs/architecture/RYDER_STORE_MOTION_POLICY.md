# Ryder store motion policy — R2 design review + R3 implementation

Status: Option D IMPLEMENTED on 2026-10-15 (Phase 2C-R3) through the single explicit
`installRyderStoreMotionPolicy` seam in `src/lib/ryder-store-motion-policy.ts`.
The canonical bundle remains byte-identical. See the R3 section at the end and
`docs/ux/PHASE_2C_R3_STORE_MOTION.md`.

## Product deviation
The canonical store intentionally has ice-like inertia: private configuration `f.store.friction = 0`, `brakeFriction = 0`, and `minKick = 2`. Releasing movement therefore does not dissipate velocity, and collisions can add rebound. The native update computes idle damping as `exp(-brakeFriction * dt)`.

Physical-device testing reported continued walking into walls with no touch. Two fresh R2 browser runs reproduced the canonical baseline independently of the Okada input bundle and Antigravity's wrappers. At zero supplied movement, initial velocity was 0; movement produced x velocity 3; after 30 released 1/60-second frames it remained 3; after 90 released frames it was -2 after collision. This is a canonical motion finding, not proof of stale touch state. Additional input defects remain possible.

Ryder intentionally rejects indefinite sliding and wall pinball. Desired practical stopping time is 100–200 ms, with low-speed, maximum-speed, diagonal and post-collision measurements required before choosing a damping value. No damping value is selected by this review. The prior exp(-14*dt) proposal is not accepted.

## Actual runtime surface and writability
`window.__capyGame.store` exposes writable `walkerVel`, `walkerPos`, `bounceTimer`, `boostTimer`, `boostMult`, and `timerActive`, plus native `enter`, `exit`, and `update` methods. Native entry resets velocity to zero. These are state/lifecycle properties, not stopping-policy settings.

The actual store instance has no `friction`, `brakeFriction`, or `minKick` property, including inherited properties. Game own properties, store prototype methods, and the inspected nested runtime objects expose no store configuration or setter. The canonical update reads closed-over `f.store`, not `this.friction`. Creating new similarly named properties would not affect that consumer and was deliberately not used as a test or fix.

The HTML contains editor range controls, but game.editor is absent. Setting the existing Brake Friction range to 15 and dispatching both input and change events left a controlled initial velocity of 0.3 unchanged after 100 ms of native updates. If 15 were consumed, the expected velocity would be 0.0669390480. The range was restored afterward. Presence of editor markup therefore does not establish a working configuration interface.

The canonical module's exports are A, E, N, R, a, r, t. Source inspection identifies these as audio/event/network/radio/asset-resolution/translation facilities, not the private store configuration. No bundle edits or config-exposure shim were made.

## Seam decision
| Candidate | Evidence and disposition |
| --- | --- |
| A — existing configuration | No exposed motion properties/configuration found; editor route did not change native motion. Not viable on tested surface. |
| B — Ryder policy object initialized once | A standalone object has no native consumer; it cannot change closed-over f.store without an additional integration seam. |
| C — narrow integration hook | Lifecycle events exist, but no per-step policy/damping callback is exposed. STORE_WALK_STATE is change-triggered and STORE_WALL_HIT is collision-triggered, not ordered per-frame hooks. Writable velocity alone does not supply reliable dt/step ordering. A separate RAF loop or vector interception would introduce an unproven motion override rather than establish a safe seam. |
| D — store.update wrapper | The direct remaining candidate providing input, dt, and native step ordering. Explicitly NOT authorized in R2 without further approval; not implemented or endorsed as-is. |
| Bundle patch | Prohibited. |

Verdict: A–C have not supplied a safe working integration path. Stop before implementing D, as R2 section 7 requires. This is a bounded runtime/source investigation, not a proof that no other design could ever exist.

## Preservation and source parity
The canonical bundle remains byte-identical, SHA-256 C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E. This hash does not make runtime physics replacements harmless.

Any eventual motion policy must operate on the store movement consumer equally for keyboard, touch, and future gamepad. TouchInputSource must continue expressing intent only. Existing intended precedence is gamepad > tilt > touch per active nonzero axis, with native keyboard fallback when normalized walking is neutral. Source registration alone must never suppress keyboard.

Antigravity's pre-existing working changes violate that fallback in EngineAdapter.compute('walkVec') and introduce store.update/clock.getDelta wrappers. Those changes remain preserved, not accepted. This review made no production edits because the design gate precedes implementation. Keyboard correction, clock-wrapper removal/isolation, and broader R1 work have not been represented as completed.

## Pause discovery, separate from motion
No game/store pause or setPaused API exists on the inspected runtime. Private state initializes paused=false, but source inspection found no uA.paused consumer. CinematicPlayer.setPaused concerns cinematic playback. store.timerActive controls only its timer. Renderer.setAnimationLoop exists but has no matching exposed getAnimationLoop and does not suspend wall-clock callbacks such as canonical fade-transition setTimeout. Menu methods are transitions, not a complete gameplay/timer/audio pause contract.

No safe complete canonical pause seam was established. Do not accept the unfinished zero-delta clock wrapper. A coordinated pause design requires a separate review; none was implemented here.

## Evidence
See docs/ux/PHASE_2C_R2_STORE_MOTION_CORRECTION.md and evidence/r2-seam-confirmation.log. The diagnostic used normal startup and offline Play, then canonical order/setMode fixtures for store entry, followed by controlled synchronous native store steps. It did not physically navigate a mission or establish real-device feel.

## R3 implementation — the accepted store-motion policy (2026-10-15)

Seam: Option D, exactly one wrapper, installed only through `installRyderStoreMotionPolicy`
(`src/lib/ryder-store-motion-policy.ts`), invoked from `initOkadaInput` against the object
reachable as `window.__capyGame.store`. No other module wraps `store.update`. The canonical
bundle is unchanged (SHA-256 C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E);
the added file is not executed until the input handle is created.

Contract enforced by the wrapper:
- it calls the captured canonical `update` exactly once with the caller's `this`, `input`, `dt` and `camera`;
- after canonical execution it damps `walkerVel.x/z` by `exp(-STORE_STOP_RATE * dt)` **only** when
  `this === store`, the store `isActive`, `dt` is finite and positive, and the effective `input.walkVec`
  is neutral (both components within `INTENT_EPSILON`);
- it never inspects the input source, so the same rule applies to keyboard, touch, tilt and future gamepad;
- it snaps to exactly zero below `STORE_STOP_SPEED`.

Constants: `STORE_STOP_RATE = 28`, `STORE_STOP_SPEED = 0.05`. From full walking speed this reaches
practical rest in ~131 ms (v≈2) to ~150 ms (diagonal v≈2.9), inside the reviewed 100–200 ms target.
The earlier rejected `exp(-14*dt)` value is not used.

Idempotency and restore: installs are reference-counted per store in a `WeakMap`, so repeated installs
reuse one wrapper and only the final `dispose()` removes it; the exact original own descriptor (or the
absence of an own property, for the inherited canonical method) is restored. A reload/`pagehide`
disposes the active handle. A store whose `update` is replaced while installed makes re-install fail
closed rather than stack wrappers.

Native keyboard fallback is untouched: `OkadaEngineAdapter.compute('walkVec')` still returns the
engine's native getter whenever normalized walking is neutral, so keyboard walking works while
touch/gamepad are registered but inactive. No synthetic keyboard events are produced anywhere.

Validation: `scripts/test_store_motion_policy.mjs` (23 unit checks) and
`scripts/test_store_motion.mjs` (25 integration checks) plus the accepted `verify-engine.mjs`
suite (40 checks). See `docs/ux/PHASE_2C_R3_STORE_MOTION.md`.
