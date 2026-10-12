# Phase 0A — Runtime Surface Enumeration & Integration-Seam Decision

> Evidence-based. Every conclusion below is grounded in (1) static analysis of the shipped bundle, (2) live runtime instrumentation in headless Chrome, or (3) direct source inspection. Offsets reference the **working shipped bundle** `capybara_shipped_app/assets/main-CSpZwCDB.js` (byte offsets, 0-based) — the input architecture is identical to the local bundle; see §3 for the local-bundle caveat.

---

## 1. Executive finding

**The engine exposes a rich public runtime object (`window.__capyGame`) with the *consumers* of input (the driving controller, store controller, camera system, physics world), but the *producers* of input — the keyboard set `Hg`, the touch-button state `bC`, the analog joystick `Di`, and the input abstraction object `rC` — are all module-scoped and NOT reachable from any global.**

Consequences:
- **Analog walking (store/on-foot) is already natively analog** (the engine's own joystick writes continuous `Di.x/z`). No patch needed.
- **Analog steering is NOT natively available** — the engine's `steerDir` getter collapses all input to `-1 / 0 / +1`. The motorcycle physics is analog-capable (`currentSteer` is a smoothed float), but the input seam is binary.
- **A dedicated brake is fully supported by physics but has no touch binding** (brake reads `Space` only).
- **A first-class normalized input layer (analog steer + throttle + brake + drift + walk) cannot be obtained *without* touching the minified bundle**, because the input state is inside the module closure. The required bundle change, however, is **small, structurally-anchored, and reproducible** — not a fragile symbol/byte-offset hack.

**Chosen verdict: VERDICT C — ISOLATED PATCH REQUIRED** (see §20).

---

## 2. Runtime architecture map (corrected)

The prior audit's diagram was essentially correct; the following is the verified, concrete version:

```
browser (top window)
  └─ React/Vite host (artifacts/capybara-delivery/src/App.tsx)   [OPTIONAL — see §15]
        └─ <iframe src="capybara-game/index.html">               [the game document]
             └─ inline scripts (embed flag; editor HMR guard)
             └─ /capybara-game/asset-proxy.js                    [fetch interceptor for /p/*.bin]
             └─ /assets/main-CSpZwCDB.js  (ES module, 6.29 MB)
                  ├─ Three.js (r172) — window.__THREE__
                  ├─ Rapier WASM — world + dynamics
                  └─ Game class rX — window.__capyGame = new rX(...)
                       ├─ renderer / scene / camera / clock
                       ├─ physicsWorld / rapierWorld
                       ├─ cameraSystem (camera controller)
                       ├─ driving  (vehicle controller Cv — consumes rC input)  [null until launched]
                       ├─ store    (store controller _v — walker consumes walkVec)
                       ├─ world / garage / missionScene / phone / audio / sponsors
                       └─ _animate()  = requestAnimationFrame game loop
```

**Who creates what (verified):**
- Three.js renderer: game class `rX` constructor (`__capyGame.renderer`).
- Rapier world/dynamics: `this.rapierDynamics = new Cv` (offset 6177092); `physicsWorld`/`rapierWorld` both present on `__capyGame`.
- Main loop: `_animate()` method on `rX` (rAF). It dispatches to `this.driving.update(rC, dt, this.cameraSystem)` in driving mode (offset 6514140).
- iframe game initialization: `window.__capyGame = this` inside the `rX` constructor (module eval → game bootstrap).
- Keyboard listeners: `window.addEventListener("keydown"/"keyup")` in the input module (offsets 3019234 / 3019399) mutating `Hg` (a `Set` of `e.code`).
- Touch listeners: `Ll()` binds `TB("btn-touch-*", A => bC.<field> = A)` (offset 3024095) + joystick `touchstart`/`touchmove`/`touchend` writing `Di` (offsets 3022674–3023012).
- Pointer/mouse listeners: `mousemove` accumulates `Ns`/`Fs` (mouse delta); joystick also has `mousedown`/`mousemove`/`mouseup` fallback.
- **Gamepad: none.** `navigator.getGamepads` / `gamepadconnected` / `gamepaddisconnected` = 0 occurrences.

---

## 3. Critical discovery: the committed bundle is syntactically broken

**VERIFIED.** The local committed bundle `artifacts/capybara-delivery/public/assets/main-CSpZwCDB.js` throws at parse time:

```
Uncaught SyntaxError: Unexpected identifier 'http'   line 2327, col 87
```

Line 2327 contains the rebrand patch introduced in `d85908d`:

```js
const JA=document.createElement("img");JA.src="data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>",JA.alt="sylens 2026",...
```

The inner double quotes (`xmlns="http://…"`) are **not escaped** inside the JS string literal, so the string terminates at `xmlns=` and `http` becomes a bare identifier. The original shipped line was well-formed:

```js
const JA=document.createElement("img");JA.src="/images/award_white_on_transparent_vibejam_winner.png",JA.alt="Vibe Jam Winner",...
```

**Implication:** the game **as committed to GitHub does not boot.** This is direct, first-hand proof that hand-editing the minified bundle is dangerous — the very approach the previous session used already shipped a broken build. (All runtime enumeration below therefore used the *working shipped* bundle, which differs from the local bundle only in the intro-logo rebrand string, fade timings, DPR clamp, and preload — none of which affect the input surface.)

---

## 4. Exposed global inventory (runtime-verified)

Enumerated via `Object.getOwnPropertyNames(window)` after boot (headless Chrome):

| Global | Type | Contents |
| :--- | :--- | :--- |
| `window.__capyGame` | instance of class `rX` | 80 own data props, 81 prototype methods (see §5) |
| `window.__capyAudio` | class `Mb` | SFX pools, music tracks, honk/drift audio, `refreshMusicVolumes()` |
| `window.__THREE__` | object | Three.js namespace (r172) |
| `window.__capyDayNight` | number (r/w) | day/night progress `0..1` |

`__capyGame` has **zero** own accessor (getter/setter) properties — all 80 own properties are plain data; all getters live on the prototype or on the separate module-scoped `rC` object (see §7).

**Not exposed:** `bC`, `Di`, `Hg`, `rC`, `Ft` — confirmed absent from both `window` and `__capyGame` (runtime `in` checks returned false).

---

## 5. `__capyGame` property tree (actual runtime names)

```
window.__capyGame  (class rX)
├── scene, camera, renderer, clock                    [Three.js]
├── cameraSystem                                      [camera controller]
├── physicsWorld, rapierWorld                         [Rapier world + dynamics]
├── outdoorLights, timeSystem, skyDome, clouds, bats, bigMoon, skyEnv, fogSystem
├── driving   (= vehicle controller; null until launched)
├── store     (class _v; on-foot controller)
│    ├── walker, walkerPos, walkerVel                 [on-foot movement]
│    ├── hasCart, cartMesh, cart, shelfItems, requiredItems, hazards, nearestItem
│    ├── timeRemaining, timerActive, boostTimer, boostMult, bounceTimer
│    ├── _interactCooldown, _itemClock
│    └── cameraSystem, renderer, scene, group, width, depth, layout, placementNodes
├── world, garage, missionScene
├── phone    (class hW: totalScore, deliveryCount, streak, activeOrder,
│             incomingOrder, offerTimer, nextOfferIn, phase, storeTime, deliveryTime…)
├── sponsors (class jW: camera, nodes Map(1280), phone, apps…)
├── audio    (class Mb)
├── speedLines, dropArrows, partyArrows, cinematicPlayer, subtitle, resultTimings
├── rain, fireworks, postProcessing, storeBeacon, debugPanel
├── remotePlayers, localChatBubble
└── _roadGraph {nodes:Array(891), adj:Array(891)}, _routeCache,
    _missionPhase, _firstStoreMission, _firstMission, _prevInteract, _deliveryPos
```

Key prototype methods on `rX` (verified list): `start`, `launch`, `prepare`, `warmGameplay`, `menuReady`, `setMode`, `resetDriving`, `repositionPlayer`, `cycleCamera`, `regenStore`, `_onOrderAccepted`, `_completeDelivery`, `triggerMissionComplete`, `triggerMissionFail`, `_animate`, `_applyRenderSize`, `setViewportElement`, `refreshViewport`, `_updateDriftButton`, `_resolveBeaconTarget`, …

**Important:** none of these are an *input* API. They are game-state/mode controls. There is **no** `setSteer`/`setInput`/`setThrottle` method.

---

## 6. Input-system map (module-scoped, all in the minified closure)

```
// keyboard
const Hg = new Set;                                  // key codes (e.code)
window.addEventListener("keydown", e => { if(!Gb(e)) Hg.add(e.code); ... });
window.addEventListener("keyup",   e => Hg.delete(e.code));
window.addEventListener("blur",  ... Hg.clear() ...);

// native touch buttons (ALL BOOLEAN)
const bC = { left:false, right:false, forward:false, backward:false, speed:false, interact:false };
function TB(id, fn){ ... bind touch/pointer on #btn-touch-* → fn(bool) ... }
function Ll(){
  TB("btn-touch-left",    A=>bC.left=A);
  TB("btn-touch-right",   A=>bC.right=A);
  TB("btn-touch-accel",   A=>bC.forward=A);
  TB("btn-touch-reverse", A=>bC.backward=A);
  TB("btn-touch-speed",   A=>bC.speed=A);
  TB("btn-touch-interact",A=>bC.interact=A);
  // #mobile-joystick → Di (touchstart/touchmove/touchend + mouse fallback)
}

// analog joystick (CONTINUOUS)
const Di = { active:false, x:0, z:0 };
const O8 = 0.18;                                      // deadzone
// joystick move handler:
//   P=E/n, D=a/n, c=sqrt(P*P+D*D);
//   if(c<O8){Di.x=0;Di.z=0}else{const h=(c-O8)/(1-O8); Di.x=P/c*h; Di.z=D/c*h;}

// input lock
let Ft = false; function V8(e){ Ft = !!e; }

// THE INPUT ABSTRACTION (plain object literal with getters) — consumed by the game
const rC = {
  get forward()  { return !Ft && (Hg.has("KeyW")||Hg.has("ArrowUp")||bC.forward); },
  get backward() { return !Ft && (Hg.has("KeyS")||Hg.has("ArrowDown")||bC.backward); },
  get left()     { return !Ft && (Hg.has("KeyA")||Hg.has("ArrowLeft")||bC.left); },
  get right()    { return !Ft && (Hg.has("KeyD")||Hg.has("ArrowRight")||bC.right); },
  get brake()    { return !Ft && Hg.has("Space"); },        // ← SPACE ONLY (no touch)
  get shift()    { return !Ft && (Hg.has("ShiftLeft")||Hg.has("ShiftRight")||bC.speed); },
  get wheelie()  { return !Ft && Hg.has("KeyF"); },         // ← KEYF ONLY (no touch)
  get interact() { return Hg.has("KeyE") || bC.interact; },
  get steerDir() { if(Ft)return 0; const e=Hg.has("KeyA")||Hg.has("ArrowLeft")||bC.left?-1:0,
                     A=Hg.has("KeyD")||Hg.has("ArrowRight")||bC.right?1:0; return Nb(e+A,-1,1); }, // BINARY
  get walkVec()  { if(Di.active) return {x:Di.x, z:Di.z, active:true};   // ANALOG
                   const e=...,A=...,g=...,I=...; return {x:e+A, z:g+I, active:false}; }, // keyboard fallback (binary)
  get mouseDragging(){ return Ze||JQ; },
  get pointerLocked(){ return JQ; },
  consumeMouseDelta(){ const e=Ns,A=Fs; return Ns=0,Fs=0,{dx:e,dy:A}; },
};
```

Offsets (shipped bundle): `Hg=new Set` 3019084; `keydown` 3019234; `keyup` 3019399; `bC`/`Di`/`O8` 3021131; `TB` 3021255; joystick handlers 3022674–3023012; `Ll` 3024095; `Ft`/`V8` 3024681; `rC` 3024700; getters 3024894–3025400.

---

## 7. Native-touch analysis

The game ships a **coherent, complete pre-existing mobile input system** (not legacy dead UI):

- `#btn-touch-left/right/accel/reverse/speed/interact` → `TB()` → write `bC.left/right/forward/backward/speed/interact` (booleans).
- `#mobile-joystick` → writes `Di.active/x/z` (continuous, deadzone 0.18).

It is gated by `body.controls-ready` CSS and hidden in-store-mode, and re-styled by the React shell. **This system is fully functional on its own** and is the correct foundation for a mobile input layer.

**Key defect of the native system:** steering is **binary** (`bC.left/right` booleans → `steerDir` ∈ {-1,0,+1}), and there is **no brake** and **no wheelie** touch binding (`brake` = Space only, `wheelie` = KeyF only). Only the joystick (`Di`) is analog.

---

## 8. Antigravity bridge analysis (touch-controls.ts)

The injected `touch-controls.ts` re-binds the **same** `#btn-touch-*` elements with `pointerdown/up/leave` handlers that dispatch **synthetic `KeyboardEvent`** (`KeyW/A/S/D/ShiftLeft/KeyE`), and quantizes `#mobile-joystick` into `KeyA/D/W/S` 8-direction keys.

**Verified mechanism:** both layers converge on the same module state — the native path writes `bC`/`Di`; the synthetic path writes `Hg` (via the keydown listener). Both are then read by `rC`'s getters. **A single physical touch currently triggers BOTH paths** (native `touchstart`→`bC` **and** bridge `pointerdown`→`stopPropagation`+`KeyboardEvent`→`Hg`), producing duplicated/competing state — exactly the "dual input" defect from the previous audit.

**Additionally:** the bridge's `pointerleave → release()` drops the input when a thumb slides off a button (the native `TB` does not have this defect), and `stopPropagation()` on pointer events interferes with the native touch handlers.

---

## 9. Driving-input pipeline (verified)

```
physical W/A/D/Space/Shift/F  ──keydown──▶ Hg (Set)
touch on #btn-touch-*         ──TB()───▶  bC (booleans)
                                          │
                                          ▼
                              rC getters: forward/backward/left/right/brake/shift/wheelie/interact/steerDir
                                          │
   _animate(): this.driving.update(rC, dt, cameraSystem)
                                          │
   Cv.update(A=...) reads: A.forward→B, A.backward, A.brake→s, A.steerDir→Q, A.shift→a, A.wheelie
                                          │
   currentSteer += (Q - currentSteer) * (1 - exp(-dt * rapierSteerSmoothing))   // Q is BINARY
   forwardSpeed/lateralSpeed/verticalSpeed + drift tiers + boost → Rapier + visual lean
```

- Throttle → `B = A.forward ? 1 : A.backward ? -1 : 0` (direction), spooled via `rapierThrottleSpoolUp:0.3`.
- Brake → `s = !!A.brake` → `rapierBrakeDecel:28` (independent of reverse).
- Steering → `Q = A.steerDir || 0` (binary), smoothed into `currentSteer` (float) via `rapierSteerSmoothing:12`.
- Drift → `a = !!A.shift`; `driftMinSpeed`, `driftBoostTier{1,2,3}Force` (8/14/22), `driftBoostDuration:0.6`.

---

## 10. Walking-input pipeline (verified)

```
#mobile-joystick touch ──▶ Di.active/x/z (continuous, deadzone 0.18)
                          │
                          ▼
rC.walkVec: if(Di.active) return {x:Di.x, z:Di.z, active:true}
            else (keyboard) return {x:e+A, z:g+I}  // 8-direction binary fallback
                          │
                          ▼
store controller (_v) walker movement
```

**The store/on-foot controller is already analog-capable.** `Di.x/z` are continuous `[-1,1]`; only the Antigravity bridge replaced this with binary key quantization. True 360° analog walking requires **no gameplay or bundle change** — only using the native joystick path (or a replacement UI that writes `Di`).

---

## 11. Brake / reverse / handbrake (definitive)

The engine distinguishes **five** longitudinal inputs; three are implemented, two lack a touch binding:

| Input | `rC` getter | Keys | Touch (`bC`) | Physics effect |
| :--- | :--- | :--- | :--- | :--- |
| Throttle | `forward` | W / ↑ | `bC.forward` | `rapierAccel:7`, spool 0.3 |
| Reverse | `backward` | S / ↓ | `bC.backward` | `rapierMaxReverse:4`, direction −1 |
| **Brake** | `brake` | **Space only** | **none** | `rapierBrakeDecel:28` (strong decel, no reversal) |
| Handbrake / Drift | `shift` | Shift L/R | `bC.speed` | drift + boost tiers 8/14/22 |
| Wheelie | `wheelie` | **F only** | **none** | `wheelieMinSpeed` hop/lean |

**Answer to the explicit question:** *Yes — a dedicated mobile brake is possible without changing motorcycle physics.* The physics already has an independent `brake` channel (`s = !!A.brake` → `rapierBrakeDecel:28`, distinct from reverse torque). The **only** missing piece is a touch binding, i.e. add `bC.brake` and extend `get brake(){ return !Ft && (Hg.has("Space") || bC.brake); }`, plus a `TB("btn-touch-brake", …)`. This is a 2–3 line change at a stable structural anchor.

---

## 12. Analog-steering analysis (definitive)

- **Physics is analog-capable:** `currentSteer` is a float, smoothed via `1 - exp(-dt·rapierSteerSmoothing)`, consumed by the visual lean (`V.currentSteer`) and the Rapier solve.
- **Input is binary:** `steerDir` getter returns `clamp(-1·(keyA|bC.left) + 1·(keyD|bC.right), -1, 1)` — only −1/0/+1.
- **Where keyboard becomes −1/0/+1:** inside the `steerDir` getter (`Hg.has("KeyA")...?-1:0`, `Hg.has("KeyD")...?1:0`).
- **Does touch supply continuous values?** For steering: **no** (`bC.left/right` are booleans). For walking: **yes** (`Di.x/z` continuous).
- **Does continuous steering survive to physics?** The *smoothed* value `currentSteer` survives; the *input* is quantized. Continuous steering therefore requires either (a) patching `steerDir` to return a continuous value, or (b) exposing `rC` and overriding the getter at runtime. No purely-runtime path exists that does not modify the closure.

---

## 13. Candidate integration seams

1. **`window.__capyGame`** — public, stable-ish (intentionally exposed; but minified class `rX` and method names are not guaranteed across re-minification). Exposes consumers, not input.
2. **`window.__capyGame.driving`** (vehicle `Cv`) — reachable only after launch; has writable `currentSteer`, `forwardSpeed`, `_smoothedThrottle`, but is overwritten each frame from binary `rC.steerDir`.
3. **`window.__capyGame.store.walker` / `store`** — reachable; but the walk *input* is `rC.walkVec`/`Di`, not a writable field on `store`.
4. **DOM `#btn-touch-*` + `#mobile-joystick`** — the native input seam; reachable, stable (durable DOM ids), and already wired to `bC`/`Di`. This is the *only* no-patch seam, and it is binary for steering.
5. **`rC`, `bC`, `Di`, `Hg`, `Ft`, `V8`** — the actual input state; **module-scoped, not reachable** without a patch.

---

## 14. Stability classification

| Seam | Class | Rationale |
| :--- | :--- | :--- |
| `window.__capyGame` (existence) | **STABLE** | Intentionally exposed global; enumerated at runtime; survives re-minification as a name (`__capyGame` is a literal). |
| `__capyGame.driving` / `.store` / `.cameraSystem` (own data props) | **SEMI-STABLE** | Real object graph, but the *class* names (`rX`,`Cv`,`_v`) and internal field names are minifier artifacts. |
| `#btn-touch-*` / `#mobile-joystick` DOM ids | **STABLE** | Durable, human-authored ids in the HTML; not minified. |
| `rC`/`bC`/`Di`/`Hg` via global | **N/A (not exposed)** | Module-scoped `const`/`let`/`Set` — unreachable without patching. |
| Minified symbols (`Cv`, `_v`, `Nb`, `TB`, `Ll`) | **FRAGILE** | Single-letter/2-letter names are module-scoped and can collide across modules; never a safe anchor. |
| Byte offsets / regex replacement | **FRAGILE** | Already proven broken: the `d85908d` rebrand string edit introduced a parse error. |

The durable, non-fragile anchors for any patch are **structural code patterns** (e.g. the literal `get steerDir(){if(Ft)return 0;`, the `const bC={left:!1,right:!1,forward:!1,...}` shape, the `get brake(){return!Ft&&Hg.has("Space")}` shape), not minified names or offsets.

---

## 15. Bundle-patch risk analysis (required if no runtime seam)

The single minimal patch needed is a **shim that exposes the input objects**, e.g. appending one statement after the `rC` definition:

```js
window.__capyInput = rC; window.__capyTouch = bC; window.__capyWalk = Di; window.__capyKeys = Hg;
```

Then a **runtime adapter** (no further bundle edits) supplies analog values by overriding the getters, e.g.:

```js
Object.defineProperty(window.__capyInput, "steerDir", { get: () => myAnalogSteer });   // -1..1
Object.defineProperty(window.__capyInput, "brake",    { get: () => myBrake });          // 0..1
Object.defineProperty(window.__capyInput, "forward",  { get: () => myThrottle });       // 0..1
```

Answers to the required questions:

- **Which symbols need exposure?** `rC` (preferred — it is the single abstraction the game consumes); optionally `bC`/`Di`/`Hg` for completeness.
- **Reliable location?** Structural anchors: `const rC={get forward(){` and `consumeMouseDelta(){...}}` (the end of the literal), or `let Ft=!1;function V8(e){Ft=!!e}`.
- **Could a build-hash change break it?** Only if the game's *input module source* changes and is re-minified; the anchor patterns are distinctive and would remain findable, but a re-minification would require re-running the patch and re-verifying (this is the core maintenance cost).
- **Structural matching vs minified names?** Structural matching is required and sufficient; names are unusable.
- **Small post-build patch exposing a durable API?** Yes — one appended line creating `window.__capyInput` etc. is idempotent and versionable.
- **Fail loudly?** The exposure shim should `console.assert(typeof rC === "object")` and set a version flag (`window.__capyInputApi = 1`); the adapter must hard-fail (not silently degrade) if the flag/object is absent.
- **Automated failure detection?** A headless smoke test: load the bundle, assert `window.__capyInput` exists and `__capyInput.steerDir` is writable/overridable; and a parse check (`node --check` on the module via `vm.SourceTextModule`, or a headless load) that the bundle has no syntax error — this alone would have caught the `d85908d` regression.
- **Maintainable for production?** Borderline. It is *small*, but it is still a patch against a closed minified artifact with no upstream source in-repo. **Patch fragility estimate: MEDIUM.**

---

## 16. Is React actually required? (analysis only)

React (`App.tsx`) currently owns:

| React-owned item | Classification |
| :--- | :--- |
| `<iframe>` hosting the game | **USEFUL** (not required — the game HTML can be the top document) |
| Toolbar (Mobile / Touch / Fullscreen) | **DEV-ONLY / UNNECESSARY** in production (fold into game UI) |
| Touch toggle | **DEV-ONLY** (input mode should be auto-detected) |
| Fullscreen button | **UNNECESSARY** (game context can do this; iOS needs its own path) |
| Mobile URL modal (localtunnel) | **DEV-ONLY** (leaked tunnel URL + IP) |
| Wouter routing | **UNNECESSARY** (single route `/`) |
| react-query / toaster / tooltip / shadcn | **UNNECESSARY** (none used by the game) |
| Error boundary | **USEFUL** (but a plain JS try/catch + `window.onerror` suffices) |

**Conclusion:** React contributes nothing the production game needs. The eventual architecture can be a **static Vite shell → game runtime → mobile UI**, with **no React**. (No removal performed; this is analysis only.)

---

## 17. Gamepad finding

```
navigator.getGamepads        : 0 occurrences
gamepadconnected             : 0 occurrences
gamepaddisconnected          : 0 occurrences
Gamepad polling in _animate  : absent
```

**NO CURRENT GAMEPAD INPUT PIPELINE FOUND.** However, because every input method funnels into the single `rC` object, a gamepad source can later be added by writing normalized axes/buttons into the same seam (the adapter or the exposed `rC`) — **without touching gameplay code** once the input seam is normalized.

---

## 18. iOS architectural implications (separated)

| Concern | Classification | Architectural implication |
| :--- | :--- | :--- |
| `requestFullscreen` on a `<div>` unsupported | **PLATFORM ISSUE** | Move fullscreen to game context; iOS requires `playsinline` + webkit path/PWA. |
| Standalone/PWA mode | **PLATFORM ISSUE** | Needs manifest + service worker (later perf/deploy phase). |
| AudioContext unlock must be same-context gesture | **PLATFORM ISSUE** | Resume `__capyAudio.ctx` on first in-game tap, not the outer shell. |
| `touch-action`, double-tap zoom, gesture nav | **INPUT ARCHITECTURE ISSUE** | `touch-action:none` + `user-select:none` on canvas/controls; pointer capture. |
| Pointer capture / thumb slide-off | **INPUT ARCHITECTURE ISSUE** | Adapter must use `setPointerCapture`, not `pointerleave`. |
| Safe areas / notch | **UI ISSUE** | `env(safe-area-inset-*)` on all HUD + controls. |
| Landscape orientation | **UI ISSUE** | Lock landscape; verify 375–430 px height layouts. |

---

## 19. Evidence table

| # | Symbol | Actual role | Written by | Read by | Externally reachable? | Stability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Hg` | key set (`Set` of `e.code`) | `keydown`/`keyup`/`blur` | `rC` getters | **No** | module (fragile) |
| 2 | `bC` | touch-button booleans `{left,right,forward,backward,speed,interact}` | `TB()` via `#btn-touch-*` | `rC` getters | **No** | module (fragile) |
| 3 | `Di` | analog joystick `{active,x,z}` | `#mobile-joystick` touch/mouse | `rC.walkVec` | **No** | module (fragile) |
| 4 | `rC` | input abstraction (getters + `consumeMouseDelta`) | constructed once | `driving.update`, `_animate` (interact/brake/backward), walker | **No** | module (fragile) |
| 5 | `Ft` | input-lock flag | `V8(e)` | all `rC` driving getters | **No** | module (fragile) |
| 6 | `window.__capyGame` | game instance (class `rX`) | `rX` constructor | (everything) | **Yes** | stable |
| 7 | `__capyGame.driving` | vehicle controller (`Cv`) | `start/launch` | `_animate` | **Yes** (post-launch) | semi-stable |
| 8 | `__capyGame.store` | store controller (`_v`) | `rX` constructor | `_animate` | **Yes** | semi-stable |
| 9 | `__capyGame.store.walker` | on-foot model | `_createWalker` | store controller | **Yes** | semi-stable |
| 10 | `#btn-touch-*`, `#mobile-joystick` | native mobile controls (DOM) | HTML | `TB()`/joystick → `bC`/`Di` | **Yes** (DOM) | stable |
| 11 | `window.__capyAudio` | audio manager | `rX` constructor | SFX/music | **Yes** | stable |
| 12 | gamepad (`getGamepads`…) | — | — | — | **absent** | n/a |

---

## 20. Remaining unknowns

1. **Exact class identity of `__capyGame.driving`** (`Cv` vs a wrapper) and whether it holds a reference to `rC` — runtime enumeration of the driving controller could not be completed because the committed bundle is broken and the menu click-through in headless mode did not reach driving mode. The **input architecture is unaffected** (the loop passes `rC` into `update` by argument).
2. **`V8`/`Ft` call sites** — not fully traced (input-lock is asserted to be the phone/menu freeze, not gameplay-critical to the input seam).
3. **Whether the game supports `window.__capyGame`-level scripted launch** (`launch()`/`setMode("driving")`) without the UI click flow — not exercised.

None of these unknowns change the integration-seam conclusion; they only affect the exact *runtime-adapter* implementation details, which belong to Phase 1.

---

## 21. Decision matrix

| Strategy | Feasible? | Stability | Complexity | Bundle modification? | Recommended? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A — Public runtime API | **No** (no input setter exposed) | — | — | No | No |
| B — Runtime adapter only | Partial (can wrap `driving.update`, but `interact`/`brake`/`backward` are read directly in `_animate`; `rC` not reachable) | Fragile | Medium | No | No (alone) |
| C — Native-touch adaptation | Yes for walking; **binary for steering**, no brake/wheelie | Stable (DOM) | Low | No | Partial |
| D — Isolated bundle patch (expose `rC`/`bC`/`Di`) + runtime adapter | **Yes** — enables full analog input | Medium | Low–Medium | **Yes (minimal, structural)** | **Yes** |
| E — Synthetic keyboard bridge (current) | Works today but buggy (double-input, `pointerleave`, no analog, no brake) | Fragile | Low | No | No |
| F — Independent reconstruction | Yes (highest ceiling) | — | Very high | n/a | Not now |

---

## 22. Architecture recommendation & VERDICT

**VERDICT C — ISOLATED PATCH REQUIRED.**

No adequate runtime-only seam exists (the input producers are module-scoped), but a **small, reproducible, structurally-anchored bundle patch** (expose the `rC` input object and its backing `bC`/`Di`/`Hg` state) creates a stable adapter API. Combined with a runtime adapter and reuse of the game's native touch DOM, this yields a first-class normalized input layer (analog steering, throttle, dedicated brake, drift, interact, analog walking, later gamepad) **without modifying physics or gameplay**.

This is *not* VERDICT A (no clean seam) or VERDICT B (adapter alone is incomplete/fragile). It is also *not* VERDICT D (the patch is small and maintainable, not broad/fragile) — though the fragility of hand-editing a closed bundle was **directly demonstrated** by the `d85908d` syntax error, so the patch must be: (1) applied by an idempotent post-build script with structural anchors, (2) versioned against the bundle, and (3) verified by a parse + smoke test in CI.

The recommended target seam shape:

```ts
interface GameInputState {           // conceptual target (Phase 1)
  steer: number;    // -1..1  → override rC.steerDir  (requires the exposure patch)
  throttle: number; // 0..1   → override rC.forward
  brake: number;    // 0..1   → override rC.brake      (physics already distinguishes)
  reverse: number;  // 0..1   → override rC.backward
  drift: boolean;   //        → override rC.shift
  interact: boolean;//        → override rC.interact
  wheelie: boolean; //        → override rC.wheelie
  phone: boolean;   //        → (game-owned; toggle phone)
  walkX: number;    // -1..1  → Di.x (native, no patch)
  walkY: number;    // -1..1  → Di.z (native, no patch)
}
```
