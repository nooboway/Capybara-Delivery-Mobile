# Phase 1 — Input Foundation Implementation Report

> Implementation report for the authorized Phase 1 (canonical engine restoration + normalized input foundation). Phases 0A/0B reports remain authoritative for the runtime-surface and bundle-integrity findings.

## 1. Starting repository state

- Branch `main`, HEAD `d85908d4b8f9f61ebe3d55cfa74a108e79bd78cf`, working tree clean except untracked `docs/`.
- Production bundle `main-CSpZwCDB.js` was **corrupt** (SHA `C758E000…`, syntax error line 2327 — Phase 0B).
- Canonical ancestor identified: `f7bfda2` (SHA `C7E6C0AE…`).

## 2. Canonical restoration result

- Restored `public/assets/main-CSpZwCDB.js` byte-faithfully from git blob `d29a1bc3…`.
- Verified size `6,588,195` and SHA-256 `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`.
- Parse PASS (acorn + esbuild). Boot PASS (`__capyGame`/`__capyAudio`/`__THREE__`).
- Branding regression from restoration is inventoried (see §21), not fixed in this phase.

## 3. Graph-walk result

Deep back-reference walk from `window.__capyGame` / `__capyAudio` / `__THREE__` found the live input abstraction object (`rC`) reachable by identity at:

```
window.__capyGame.world._lastInput
window.__capyGame.world.rapierContacts.destructibles._lastInput
```

The candidate was validated by its exact getter shape (`steerDir`, `walkVec`, `forward`, `backward`, `brake`, `shift`, `interact`); all getters are `configurable: true` and override cleanly (`steerDir` readback `0.37`).

## 4. Patch/no-patch decision

**NO BUNDLE PATCH.** `rC` is reachable at runtime, so the deterministic exposure shim designed in Phase 0B is not required. Architecture = **Runtime adapter — no bundle patch required** (verified live).

## 5. Files changed

Added:
- `src/lib/input/types.ts` — normalized input model + neutral state.
- `src/lib/input/input-manager.ts` — `OkadaInputManager` (state, arbitration, reset).
- `src/lib/input/engine-adapter.ts` — `OkadaEngineAdapter` (resolve `rC`, override getters, keyboard fallback).
- `src/lib/input/sources/touch.ts` — `TouchInputSource` (pointer capture controls).
- `src/lib/input/sources/gamepad.ts` — `GamepadInputSource` (Phase-2 stub).
- `src/lib/input/index.ts` — `initOkadaInput` entry point.
- `scripts/verify-engine.mjs` — automated verification (15 checks).

Modified:
- `src/App.tsx` — replaced `installTouchControls` with `initOkadaInput`; removed the touch toggle and the localtunnel/mobile modal (dev-only, contained a tunnel password + local IP).
- `package.json` — added `verify:engine` script.

Removed:
- `src/lib/touch-controls.ts` — the synthetic-keyboard bridge (fully superseded).

Restored:
- `public/assets/main-CSpZwCDB.js` — canonical engine (reverted `d85908d` corruption).

## 6. Input architecture

`touch/gamepad/tilt → OkadaInputManager → OkadaEngineAdapter → rC → controllers → Three.js + Rapier`, with the engine's native keyboard path preserved as the adapter's fallback.

## 7. Engine API

`initOkadaInput(win, doc, options)` resolves `rC` at runtime (via `_lastInput`, shape-validated), overrides its getters, and returns `{ manager, adapter, touch, gamepad, dispose() }`. Installs `window.__okadaInput` for tests.

## 8. Steering verification

`manager.apply("touch", { steer })` for `-1, -0.5, -0.1, 0, 0.1, 0.35, 0.5, 1` all read back exactly through `rC.steerDir`. The vehicle consumer (`Cv.update` → `currentSteer` smoothing) reads this getter (Phase 0A static trace); live `currentSteer` observation in driving mode was not reached headlessly (see §22).

## 9. Throttle verification

`throttle` maps to `rC.forward` (binary). Verified `forward: true` when throttle applied. Engine is binary at this boundary (documented, not invented).

## 10. Brake verification

`brake` maps to `rC.brake` (dedicated channel). Verified `brake: true` with `backward: false`. This gives a dedicated mobile brake independent of reverse.

## 11. Reverse verification

`reverse` maps to `rC.backward`. Verified `backward: true` with `brake: false` — reverse remains semantically distinct from brake.

## 12. Drift verification

`drift` maps to `rC.shift` (handbrake/drift are the same engine action). Verified the mapping; drift physics untouched.

## 13. Interact verification

`interact` maps to `rC.interact` (level-triggered; the engine performs its own edge detection). Verified mapping.

## 14. Wheelie verification

`wheelie` maps to `rC.wheelie`. Mapping present; no dedicated validation control in this phase.

## 15. Phone verification

`phone` exists in the normalized model but is **not** wired to the engine (the phone is game-owned UI, not an `rC` channel). Deferred to Phase 3.

## 16. Walking verification

`walkX/walkY` map to `rC.walkVec` as a continuous 2D vector. Verified non-cardinal `{x: 0.42, z: 0.71, active: true}` (engine forward = `-z`; `walkY` mapped accordingly). No WASD thresholds.

## 17. Keyboard compatibility

Keyboard remains native. Adapter overrides only activate when a normalized source contributes a non-neutral value; otherwise the original getter (keyboard/native) is returned. `reset()` returns all axes to the keyboard path.

## 18. Pointer/release safety

Touch controls use `setPointerCapture` + `pointerId` tracking (simultaneous controls don't steal one another). Central `reset()` runs on pointer up/cancel/lost-capture, window `blur`, and `visibilitychange`. Verified: after applying full input then `reset()`, all axes are neutral and `steerDir` reads back `0`.

## 19. Automated test results

`verify-engine.mjs`: **15 pass, 0 fail** (hash, size, parse×2, bundle, boot×3, resolve, steering, brake, reverse, throttle, walk, reset).

## 20. Manual game-loop results

Full delivery loop was **not** manually driven in this phase (headless driving mode was not reachable in the available time; the corrupt bundle blocked gameplay in prior phases). Boot to a running world state was confirmed. Flagged as the main validation gap for Phase 2.

## 21. Known regressions

- **Branding (inventory only, not fixed):** restoring the canonical engine reintroduces "Capybaras Delivering Food" / "Vibe Jam Winner" / vibejam portal links inside the engine, while the HTML shell still says "Okada". These are **ENGINE-EMBEDDED** and will be re-applied via a deterministic transform in a later phase (the correct SVG data URL must be quoted).
- **Local dev modal removed** (was leaking a tunnel password + local IP); no production impact.
- **Native `#btn-touch-*` binary controls** are no longer surfaced by the shell (the `controls-ready` class was only added by the removed bridge); the Phase-1 `okada-*` controls replace them for validation.

## 22. Remaining risks

1. **Live consumer observation** — fractional steering was proven at the `rC` boundary and via the Phase 0A static trace (`Cv.update` reads `i.steerDir`), but `currentSteer` was not observed moving in driving mode headlessly.
2. **`_lastInput` path stability** — semi-stable (reachable, but not an intentional API). Documented in the contract with the Phase 0B exposure shim as fallback.
3. **Branding re-application** — deferred deterministic transform still pending.

## 23. Phase 2 readiness recommendation

**CONDITIONAL PASS.** The canonical engine is restored and the normalized input foundation is production-viable and verified (15/15 automated checks, typecheck, build). Phase 2 can proceed on this foundation; the open items (final analog touch-control UX, phone/action wiring, branding re-application, driving-mode consumer smoke test) are scoped to Phase 2/3.

## Decision

**PHASE 1 — CONDITIONAL PASS.**
