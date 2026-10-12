# Phase 1C — Corrective Integration Report

> Corrective pass over Phase 1. Preserves the validated architecture (canonical engine, no bundle patch, `_lastInput`→`rC` resolution, normalized manager/adapter); fixes the touch/event/lifecycle integration defects identified by Codex review.

## 1. Executive summary

Phase 1 established a correct architecture but a defective touch integration. Five defects (F1–F5) plus an engine-interlock gap and a teardown gap were reproduced and corrected. The normalized core (manager/adapter mapping) was not redesigned. All fixes are verified by a layered automated suite (31 checks, Layers A–D). Live driving-mode validation remains blocked headlessly (software-WebGL boot ~68 s; the mission/driving controller is only created by the tutorial/mission flow).

**Verdict: CONDITIONAL PASS** — core corrections verified; bounded runtime validation (fractional steering live-downstream + delivery loop) deferred to adversarial QA.

## 2. Starting commit

`bda3cf74a8c8c7361e27a66fa8e278f72538b252`

## 3. Initial git state

Clean working tree (only untracked `docs/` from prior phases, already committed). No unrelated user work was present or modified.

## 4. Scope

F1–F5 (control root, reset ownership, pointer ownership, walking visibility, iframe lifecycle), engine input-lock preservation, teardown/descriptor restoration, event-driven tests, and minimal documentation. No visual redesign, no gameplay/physics/mission/scoring changes, no bundle modification.

## 5. F1 reproduction

`TouchInputSource` used `STYLE_ID === ROOT_ID === "okada-phase1-controls"`. `injectStyles()` created `<style id="okada-phase1-controls">` in `<head>`; `ensureRoot()` then `getElementById("okada-phase1-controls")` returned the STYLE, and buttons were appended inside the `<style>` element → controls never rendered.

## 6. F1 correction

Distinct identifiers (`okada-phase1-controls-style` / `okada-phase1-controls-root`). `ensureRoot()` validates `tagName === "DIV"` and recreates a mismatched element. Verified: STYLE in HEAD, DIV root in BODY, GAS/steer are children of the root and hit-testable.

## 7. F2 reproduction

`manager.reset()` cleared the manager's resolved state but the `TouchInputSource` retained its own `contribution`. After blur, pressing BRK re-published the source's stale `contribution`, resurrecting the held GAS.

## 8. F2 correction

Added a deliberate reset contract: `handle.reset(reason)` → `touch.reset()` + `gamepad.reset()` + `manager.reset()`. `touch.reset()` clears contribution, button/steer/walk ownership, pointer IDs, and visual active states, then releases from the manager. Blur/visibility/mode-transition/teardown all route through this single path.

## 9. F3 reproduction

Buttons used a bare `pointerdown→onPress` / `pointerup→onRelease` pair with no owner tracking: pointer1 down GAS, pointer2 down GAS, pointer1 up → GAS released while pointer2 still held.

## 10. Pointer ownership policy

- **Digital buttons (GAS/BRK/DRIFT/E): Policy A — multi-owner set.** `owners = Set<pointerId>`; active while `owners.size > 0`; each `up`/`cancel`/`lostpointercapture` removes only its own pointer.
- **Analog (steer, walk): exclusive owner.** A single `owner: pointerId`; only the owner may move/release the control.

## 11. F3 correction

Implemented the above. `safeCapture()` guards `setPointerCapture` (throws on synthetic/disposed pointers). Verified: two pointers on GAS keep it active until the last releases; steering + GAS work simultaneously; releasing GAS does not reset steering; a non-owner pointer cannot move/release an analog control; cancel/lost-capture neutralize.

## 12. F4 analysis

`#okada-walk` started `display:none` and its only reveal was its own `pointerdown`, which a hidden element cannot receive.

## 13. Game-mode signal selected

`document.body.classList.contains("in-store-mode")` — the canonical engine toggles this class on `STORE_ENTERED`/`STORE_EXITED` (non-invasive, no bundle patch). Observed via a `MutationObserver` on `body` class attributes, reconciled against `window.__capyGame.mode` when available.

## 14. F4 correction

`setMode("store")` shows the walk stick and hides driving controls; `setMode("driving")` does the inverse. Mode transitions reset obsolete channels (GAS is never carried into store; walk vector never carried out). Walking stays analog (continuous `walkX/walkY` → `rC.walkVec`), no WASD quantization.

## 15. F5 analysis

A module-level `inputHandle` with an `if (!inputHandle) return` guard survived iframe reload: the new document never got a new handle, and a delayed async `initOkadaInput` could install a handle bound to a dead document.

## 16. F5 correction

`prepareGameFrame` now aborts the previous `AbortController`, disposes the previous handle, and initializes a new one bound to the current document. `initOkadaInput` accepts an `AbortSignal`; `waitForInput` aborts on signal. Stale async completion is discarded (`signal.aborted → handle.dispose()`). Unmount aborts + disposes.

## 17. Disposal contract

`handle.dispose()` is idempotent and: detaches touch DOM, stops gamepad, resets the manager, restores adapter descriptors, removes blur/visibility listeners, and deletes `window.__okadaInput`.

## 18. Descriptor restoration

`OkadaEngineAdapter.override()` records original `PropertyDescriptor`s; `restore()` re-applies them on dispose. Verified: override `steerDir=0.35`, dispose, then `rC.steerDir` returns the original engine value (`0`).

## 19. Engine lock/interlock analysis

The engine's input getters are gated by a module-scoped lock `Ft` (set/unset together with `body.tutorial-locked` during the tutorial intro cinematic). `Ft` is not exposed, but `body.classList.contains("tutorial-locked")` is a faithful proxy. The adapter now checks this and, when locked, returns the original (gated) value instead of injecting normalized values.

## 20. Native-control coexistence

The canonical engine can add `controls-ready` and surface its own binary `#mobile-controls`. To avoid a duplicate active control surface during Phase 1C, the Okada touch source suppresses `#mobile-controls` via injected CSS while the normalized layer owns input. This is a documented temporary measure; Phase 2 owns the final control set.

## 21. Test architecture

`scripts/verify-engine.mjs` (bundles the real `src/lib/input` via esbuild; drives a headless Chrome):
- **Layer A** — canonical integrity: SHA, size, parse (acorn + esbuild).
- **Layer B** — manager/adapter: fractional steering, brake/reverse/throttle, walk vector, keyboard fallback, interlock, descriptor restore.
- **Layer C** — touch events: F1 root, GAS down/up, multitouch ownership, simultaneous steer+GAS, cancel, blur no-resurrection, mode visibility, analog non-cardinal walk.
- **Layer D** — lifecycle: aborted init → null, dispose idempotency.

## 22. Automated test results

**31 pass, 0 fail** (Layer A: 8, B: 11, C: 12, D: 2).

## 23. Interactive browser results

**BLOCKED.** Headless software-WebGL boot takes ~68 s and the mission/driving controller is only created by the tutorial/mission flow; a real interactive driving-mode session was not completed in this environment. Boot to a running world state is verified.

## 24. Fractional steering runtime result

**Boundary: PASS** — `steerDir` readback `{ -1, -0.5, 0, 0.35, 1 }` all correct at the `rC` boundary, and `Cv.update` is statically confirmed (Phase 0A) to read `i.steerDir` into `currentSteer`. **Live downstream (`currentSteer` movement): UNRESOLVED** — requires the mission driving controller, which could not be created headlessly (`setMode("driving")` does not instantiate `driving`).

## 25. Analog walking runtime result

**PASS.** A real pointer drag on the (store-mode-visible) walk stick produced a continuous non-cardinal vector (`walkX≈0.58, walkY≈0.58`) at `rC.walkVec`; mode exit resets it.

## 26. Brake/reverse result

**PASS.** `brake` and `reverse` map to distinct engine channels (`brake`/`backward`), independent and non-overlapping.

## 27. Keyboard fallback result

**PASS.** With no normalized source active, the adapter returns the original engine getter (native keyboard) value.

## 28. Delivery-loop result

**BLOCKED.** Full delivery loop (order → drive → store → walk → deliver) not driven headlessly for the same reason as §23. Not altered to force a pass.

## 29. Remaining unresolved issues

1. Fractional-steering live-downstream (`currentSteer`) in mission driving mode — deferred to adversarial QA on real hardware.
2. Full delivery loop + interactive driving smoke — deferred to adversarial QA.
3. Final control presentation (native vs Okada) — Phase 2.

## 30. F6 deployment status

**DEFERRED.** Current deployment contract is origin-root only (`/capybara-game/...`, `/assets/...`, `/p/...`, `/api/...` are root-absolute). Subpath/base-aware deployment is backlogged for the deployment phase.

## 31. Gamepad status

**DEFERRED.** `GamepadInputSource` remains a documented API stub; it is architecture-ready, not implemented.

## 32. Files changed

- `src/lib/input/sources/touch.ts` — F1/F2/F3/F4 fixes, pointer ownership, mode observer, native-control suppression.
- `src/lib/input/engine-adapter.ts` — interlock preservation, descriptor restore.
- `src/lib/input/index.ts` — reset coordinator, AbortSignal support, dispose/restore.
- `src/lib/input/sources/gamepad.ts` — `reset()` contract.
- `src/App.tsx` — F5 iframe lifecycle (AbortController + generation).
- `scripts/verify-engine.mjs` — rewritten layered suite (Layers A–D).
- Docs: `docs/audit/PHASE_1C_CORRECTIVE_INTEGRATION.md` (this file), `docs/audit/PHASE_1_INPUT_FOUNDATION.md` (corrections), `docs/architecture/ENGINE_INPUT_CONTRACT.md` (interlock/reset/mode/ownership).

## 33. Commit information

`fix(input): harden touch lifecycle and integration` (no push).

## 34. Phase 2 recommendation

**READY FOR ADVERSARIAL QA.** Core integration is correct and fully covered by automated tests; the remaining items are runtime-on-hardware validations (fractional-steering downstream, delivery loop) that belong to adversarial QA before Phase 2.
