# Engine Input Contract

> The boundary between the closed Okada game engine and Okada-owned code. This is the source of truth for how normalized input reaches the engine, and the invariants future developers must not break.

## 1. Canonical engine identity

| Field | Value |
| :--- | :--- |
| File | `artifacts/capybara-delivery/public/assets/main-CSpZwCDB.js` |
| Git object (blob) | `d29a1bc39522b5461606b864e2f0d73734b00d3c` (commit `f7bfda2`) |
| Byte size | `6,588,195` |
| SHA-256 | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` |
| Parse | PASS (acorn 8.18 + esbuild 0.18) |
| Boot | PASS (`window.__capyGame`, `__capyAudio`, `__THREE__`) |

The engine is **immutable**. Do not hand-edit it. The only restoration performed in Phase 1 was reverting the corrupt `d85908d` blob back to this canonical ancestor.

## 2. Bundle patch: NOT REQUIRED

Phase 1's final no-patch gate proved the engine's single input abstraction object is **already reachable at runtime**, so no bundle modification was made.

- The engine's input object (`rC`) is a module-scoped `const` but is stored by the world controller each frame as `_lastInput`, and is reachable by identity from the exposed `window.__capyGame`:

  ```
  window.__capyGame.world._lastInput
  window.__capyGame.world.rapierContacts.destructibles._lastInput
  ```

- The candidate is validated by shape (getters `steerDir`, `walkVec`, `forward`, `backward`, `brake`, `shift`, `interact`) before use. All getters are `configurable: true`, so `Object.defineProperty` override works (verified: `steerDir` readback `0.37`).

If the engine is ever re-bundled such that this path changes, a deterministic exposure shim is the documented fallback (see `docs/audit/PHASE_0B_BUNDLE_INTEGRITY.md` §14), but it is **not** needed today.

## 3. Engine input abstraction (`rC`) — actual semantics

| Getter | Type | Engine consumption | Notes |
| :--- | :--- | :--- | :--- |
| `steerDir` | binary `-1/0/+1` (native) | **analog-capable**: `Cv.update` smooths `currentSteer += (steerDir - currentSteer) * (1 - exp(-dt·rapierSteerSmoothing))` | The one channel that accepts a continuous value via override |
| `forward` | boolean | `B = forward ? 1 : backward ? -1 : 0` | Throttle is **binary**; the engine applies its own spool (`rapierThrottleSpoolUp`) |
| `backward` | boolean | direction `-1` (reverse torque) | Distinct from brake |
| `brake` | boolean | `rapierBrakeDecel: 28` | Native keyboard `Space` only; **no native touch binding** |
| `shift` | boolean | drift + boost tiers (8/14/22) | Handbrake and drift are the **same** engine action |
| `interact` | boolean | level-triggered; engine performs its own edge detection (`rC.interact && !_prevInteract`) | |
| `wheelie` | boolean | hop/lean | Keyboard `F` only |
| `walkVec` | `{x, z, active}` | store/on-foot movement | **analog**: native `Di.x/z` are continuous (deadzone `0.18`); engine forward is `-z` |
| `mouseDragging` / `pointerLocked` / `consumeMouseDelta` | — | camera orbit | not adapted |

There is no `rC` getter for the phone; the phone is game-owned UI (Tab / click), deferred to Phase 3.

## 4. Okada input architecture

```
touch ──┐
gamepad ─┤ (future)
tilt ────┘ (future)
          │
          ▼
   OkadaInputManager  (normalized state + arbitration + reset)
          │
          ▼
   OkadaEngineAdapter  (overrides rC getters; keyboard fallback)
          │
          ▼
         rC  →  controllers  →  Three.js + Rapier
```

Files (all under `src/lib/input/`): `types.ts`, `input-manager.ts`, `engine-adapter.ts`, `sources/touch.ts`, `sources/gamepad.ts`, `index.ts`.

## 5. Public API

`initOkadaInput(win, doc, options)` → `Promise<OkadaInputHandle | null>` returns `{ manager, adapter, touch, gamepad, dispose() }` and installs `window.__okadaInput` (debug/testing handle).

The engine adapter is the **only** code that knows `rC` and the `_lastInput` path. Minified internals (`rC`, `bC`, `Di`, `Hg`) stop at this boundary; `bC`/`Di`/`Hg` are **not** exposed.

## 6. Normalized action model

```ts
interface OkadaInputState {
  steer: number;      // -1..1
  throttle: number;   // 0..1 (binary at engine boundary; thresholded >0)
  brake: number;      // 0..1 (binary)
  reverse: number;    // 0..1 (binary, distinct from brake)
  drift: boolean;     // handbrake/drift (same engine action)
  interact: boolean;  // level-triggered
  wheelie: boolean;
  phone: boolean;     // not yet mapped to the engine (Phase 3)
  walkX: number;      // -1..1 lateral
  walkY: number;      // -1..1 longitudinal (forward; engine z = -walkY)
}
```

## 7. Keyboard fallback

Keyboard remains **native** (the engine's own `Hg` set → `rC` original getters). The adapter overrides each getter as:

```
if (normalized source active on this axis) return normalized value
else return original engine value (keyboard/native touch)
```

This preserves desktop keyboard play exactly.

## 8. Input arbitration

- Sources: `gamepad > tilt > touch` (priority). Only `touch` is implemented in Phase 1.
- Each numeric axis is owned by the highest-priority source currently contributing a non-neutral value.
- When a source goes neutral/releases, the axis falls through to the next active source, then to neutral → adapter returns the original (keyboard) value.
- There is no "last event wins forever": a source that stops contributing is removed from the axis.

## 9. Release / reset

`OkadaInputManager.reset()` forces every axis neutral. It is invoked centrally on: pointer `up`/`cancel`/`lostpointercapture`, window `blur`, and `visibilitychange` (hidden). Touch controls use `setPointerCapture` and track `pointerId`, so simultaneous controls do not steal one another.

## 10. Known limitations

- Throttle/brake/reverse/drift/interact/wheelie are **binary** at the engine boundary (the engine only exposes booleans there). The normalized model uses 0..1 scalars for future-proofing; the adapter thresholds them.
- Steering is the only channel where a **fractional** value demonstrably flows into the engine's analog smoothing.
- The `phone` action is not yet wired to the engine (game-owned UI; Phase 3).

## 11. Invariants (do not break)

1. Never hand-edit `public/assets/main-CSpZwCDB.js`; its SHA-256 must remain `C7E6C0AE…`.
2. Never expose `bC`, `Di`, or `Hg`.
3. Never reintroduce a synthetic-keyboard bridge (the old `touch-controls.ts` was removed).
4. Never route walking through WASD thresholds; walking must be a continuous 2D vector.
5. Every continuous input must neutralize on pointer up/cancel/lost-capture/blur/visibility.
6. The engine adapter is the only place that may reference `rC`/`_lastInput`.
7. Keyboard must keep working when no normalized source is active.

## 12. Verification

`pnpm --filter @workspace/capybara-delivery run verify:engine` runs `scripts/verify-engine.mjs` (15 checks): canonical hash, parse, boot, API resolution, fractional steering readback `-1..1`, brake/reverse/throttle independence, non-cardinal walk vector, and release/reset neutrality.
