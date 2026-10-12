# Mobile Controls — Architecture Recommendation

> Analysis of control schemes for a mobile-first arcade motorcycle-delivery game, grounded in the verified input architecture.

## 1. Verified input architecture (facts)

- The engine natively reads a discrete key set `Hg` (keyboard) **and** a touch state object `bC` (`bC.left/right/interact`) plus an analog vector `Di` (`Di.x/z`, `Di.active`) for store walking.
- `get steerDir()` currently folds everything into `-1 / 0 / +1` (binary), then the vehicle controller applies exponential smoothing (`1 - exp(-g * steerSmoothing)`), so the physics *can* consume a continuous value — the input layer is the bottleneck.
- `get brake()` reads `Hg.has("Space")`; the mobile HUD has **no** brake button (its "reverse" maps to `KeyS` = reverse torque).
- The engine exposes `window.__capyGame` and `window.__capyAudio`; the input state objects (`bC`, `Di`) are created inside the bundle — reachability via the global is **UNVERIFIED** and must be enumerated first.
- The game already ships touch buttons (`#btn-touch-*`) and an in-store joystick (`#mobile-joystick`) in its own HTML.

## 2. Control-scheme evaluation

| Scheme | Thumb ergonomics | Responsiveness | Multitouch | Visual obstruction | Learning curve | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Binary L/R buttons (current) | OK | Snappy but twitchy (full-lock only) | High | Low | Low | Reject as primary |
| **Analog dynamic thumbstick (steering)** | Best | Smooth, progressive | High | Low (transparent) | Low | **Adopt** |
| Progressive steering regions (tap zones) | Good | Good | High | Low | Low | Acceptable fallback |
| Tilt steering (accelerometer) | Hands-free left thumb | Device-dependent | n/a | none | Higher | Optional secondary |
| Accelerator pedal (hold) | Good | Analog via pressure zones | High | Low | Low | **Adopt** |
| Dedicated brake | Good | Instant (maps to `brake`, not reverse) | High | Low | Low | **Adopt (missing today)** |
| Reverse | Good | Secondary | High | Low | Low | Adopt (distinct from brake) |
| Drift/handbrake trigger | Good | Binary is correct (drift is on/off) | High | Low | Low | **Adopt** |
| Contextual interact (E) | Good | Tap | High | Low | Low | **Adopt** |
| Store movement joystick (analog 360°) | Best | Must feed `Di` directly | High | Low | Low | **Adopt (fix current 8-dir bug)** |

## 3. Unified input abstraction (RECOMMENDATION)

```
Touch  ─┐
Keyboard─┤
Gamepad ─┼─► Normalized Input State ─► Game Controllers ─► Simulation
Tilt   ─┘        (steerDir ∈ [-1,1],
                  throttle ∈ [0,1],
                  brake, drift, interact,
                  walkVec ∈ {x,z})
```

- **One source of truth** for input state. Touch must write the *same* normalized state the keyboard writes, not a parallel `KeyboardEvent` stream.
- Prefer binding to the engine's native `bC`/`Di` (or an input setter on `window.__capyGame`) **before** considering bundle patching.
- If `bC`/`Di` are unreachable, the fallback is a minimal, well-scoped patch that maps pointer events into those objects — still far better than synthetic `KeyboardEvent`s (which break `stopPropagation`, `keyup` pairing, and `pointerleave`).

## 4. Whether the keyboard-event bridge should be removed

**Yes — remove `touch-controls.ts`'s synthetic-keyboard bridge.** It is the root cause of: duplicate state mutation, missed `keyup` when thumbs slide off, pointer/touch event race desync, and the 8-direction store-walk bug. It also cannot express analog steering or a real brake.

## 5. Can the engine take analog input directly?

- **Yes, in principle.** The physics consumes continuous `steerDir` and `walkVec`. The blocker is that the current getters collapse to binary and the input state is inside the closure.
- A clean integration therefore requires either (a) a public input API (preferred — check `window.__capyGame`), or (b) a targeted, versioned patch to the two getters and the `bC`/`Di` writers.
- Gamepads: the bundle currently has **no** Gamepad API usage (`getGamepads`/`gamepadconnected` = 0 occurrences). Gamepad support would be a **new** feature (via `navigator.getGamepads()` polling mapped into the same normalized state), not a repair.
