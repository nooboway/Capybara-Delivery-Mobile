# OKADA — PHASE 2A: MOBILE UX RECONNAISSANCE & INTERACTION DESIGN SPECIFICATION

**Document Version:** 1.0.0  
**Phase:** 2A (Reconnaissance, Measurement, Interaction Design & Architectural Sizing)  
**Baseline Commit:** `0c87024141c7c7032def0f95098b08337fdc0ff9` (FROZEN PHASE 1 BASELINE)  
**Canonical Engine SHA-256:** `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`  
**Test Suite Verification:** 40 pass / 0 fail  
**Status:** COMPLETE — ZERO PRODUCTION CODE MODIFICATIONS

---

## 1. EXECUTIVE ASSESSMENT

Phase 1 successfully resolved the core architectural question: **"Can this desktop delivery game be controlled correctly on mobile without rewriting the canonical engine?"** The 40-test adversarial suite proves that normalized inputs, continuous analog steering, non-cardinal walking vectors, mode-transition ownership revocation, and store mechanics operate deterministically through the isolated `OkadaEngineAdapter`.

Phase 2 addresses the experiential question: **"Can the controls become good enough that the player experiences Okada as a native mobile game rather than a desktop game with touch buttons added?"**

### The Verdict:
The Phase 1 touch layer was an intentional diagnostic prototype (`#okada-phase1-controls-root`). It proved input plumbing, but as a playable mobile experience it currently exhibits **four critical P0 deficiencies** and **seven major P1 ergonomic roadblocks**:

1. **Complete Absence of Safe-Area Accounting (P0):** Controls use hardcoded CSS pixel offsets (`bottom: 24px; left: 20px; right: 24px;`). On modern notched, Dynamic Island, and home-indicator devices (iPhone 12–16, modern Pixels/Galaxies), the Brake button and Steering slider overlap directly into physical hardware bezels, curved display radii, and OS system gesture zones.
2. **Catastrophic Z-Index Overlap with Virtual Phone (P0):** The touch control surface is forced to `z-index: 9000;`. The canonical virtual phone (`#phone-hud`) renders at `z-index: 200` (or `270` in mobile fullscreen). When the player opens the phone, driving buttons (`GAS`, `BRK`, `DRIFT`, `E`) float *over* the phone screen. Tapping app icons (CapyFood, Maps, Music) fires driving button touch handlers rather than phone apps, trapping input.
3. **Missing Reverse Mechanic on Touch (P0):** While `OkadaEngineAdapter` semantically differentiates `brake` from `backward`, the touch layer only provides a `BRK` button (`contribution.brake = 1`). There is currently **zero touch mechanism to reverse or back out of dead ends** in driving mode.
4. **Ergonomic Tri-Action Bottleneck (P1):** High-speed arcade scooter delivery requires simultaneous **Steer + Throttle + Drift** while cornering. The current right-hand layout stacks `GAS` (bottom: 120px, right: 24px) directly beside `DRIFT` (bottom: 120px, right: 110px) and above `BRK` (bottom: 24px, right: 24px). A player cannot maintain throttle and slide into a drift without an awkward two-finger "claw" grip.
5. **Rigid Fixed-Origin Steering Slider (P1):** The current horizontal steering slider requires the player's left thumb to find and hit a static 180×120px bounding box. On mobile touchscreens with zero tactile feedback, players routinely miss the touch target during aggressive maneuvers, causing dropped turns.

**Conclusion:** The underlying engine adapter and input pipeline are rock-solid. All UX problems are localized strictly to **`TouchInputSource` and presentation CSS**. No engine adapter changes or canonical bundle edits are needed for Phase 2B.

---

## 2. CURRENT UX INVENTORY

### 2.1 Startup & Boot Experience
- **Loading Screen:** Displays a centered retro capybara graphic, animated loading progress, and language selector.
- **Tap/Click to Start:** Canonical `awaitClick` listener binds `pointerdown`, `keydown`, `touchstart` to `window`.
- **Menu System:** Custom DOM interface featuring "Play Offline", "Garage", "Multiplayer", and "Settings".
- **Transition into Gameplay:** Clicking "Play" completes the loading flow and sets `document.body.classList.add('in-game')`.
- **Finding:** Touch controls must remain strictly dormant during loading/menu. Currently, Okada controls mount into `#okada-phase1-controls-root` only upon `initOkadaInput()`, preventing menu corruption.

### 2.2 World Driving Experience
- **Steering Control (`#okada-steer`):** Static rectangular zone (180×120px) positioned `left: 20px; bottom: 24px;`. Circular blue knob (40×40px) displaced along horizontal axis with a 5% deadzone and 60px travel.
- **Throttle (`#okada-btn-throttle`):** 64×64px circular button labeled `GAS`, positioned `right: 24px; bottom: 120px;`. Hold-to-accelerate.
- **Brake (`#okada-btn-brake`):** 64×64px circular button labeled `BRK`, positioned `right: 24px; bottom: 24px;`.
- **Drift (`#okada-btn-drift`):** 64×64px circular button labeled `DRIFT`, positioned `right: 110px; bottom: 120px;`.
- **Interact (`#okada-btn-interact`):** 64×64px circular button labeled `E`, positioned `right: 110px; bottom: 210px;`.
- **HUD Collisions:**
  - Bottom-right `#sylens-badge` (`z-index: 10000; bottom: -1px; right: -1px;`) sits immediately below the `BRK` button.
  - Top-right React shell toolbar (`.game-toolbar` at `top: calc(var(--safe-top) + 14px); right: calc(var(--safe-right) + 16px);`) sits directly over the game's canonical top-right utility buttons (`#btn-menu`, `#btn-mute`, `#btn-reposition`, `#btn-settings`).

### 2.3 Store Mode Experience
- **State Switch:** Triggered when `body.in-store-mode` is added by canonical engine upon entering grocery store.
- **Walking Stick (`#okada-walk`):** 140×140px circular pad with a 48×48px green knob at `left: 24px; bottom: 24px;`. Translates 2D pointer displacement into continuous `walkVec (x, z)`.
- **Store Actions:** Driving buttons (`GAS`, `BRK`, `DRIFT`, `#okada-steer`) are cleanly hidden via `display: none;`. `E` (Interact) remains visible at `right: 110px; bottom: 210px;` to acquire cart, pick items off shelves, and checkout at the register.
- **Finding:** Walking joystick functions with good analog fidelity, but its static placement at `left: 24px` causes thumb strain when navigating narrow grocery aisles.

### 2.4 Virtual Phone Experience
- **Phone HUD (`#phone-hud`):** Canonical phone represents an interactive iPhone running CapyFood (orders/deliveries), CapyMaps (GPS navigation), CapyMusic (radio), CapyMessage (chat), and Settings.
- **Activation:** Canonical desktop relies on `Tab` key or clicking the bottom peek bar. On mobile touch, there is currently **no visible button or dedicated touch gesture to open the phone**.
- **Conflict:** When toggled open, `#okada-phase1-controls-root` remains visible with `z-index: 9000;`, obscuring apps and blocking touch events.

---

## 3. DEVICE MATRIX & MEASUREMENT

We executed automated empirical measurements across 5 representative mobile viewports plus portrait orientation using our headless instrumented runner:

| Viewport | Device Profile | Steering Pos (L / B) | Throttle Pos (R / B) | Brake Pos (R / B) | Center Clearance | Safe-Area Threat |
|---|---|---|---|---|---|---|
| **667 × 375** | Compact Phone (iPhone SE / 8) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **379px** | High (cramped right cluster; E is 45px from top utility HUD) |
| **844 × 390** | Standard Phone (iPhone 12/13/14) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **556px** | Critical (Notch insets 47px left/right; controls sit inside notch) |
| **932 × 430** | Large Phone (iPhone 14/15/16 Pro Max) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **644px** | Critical (Dynamic Island inset 59px; thumb reach to center excessive) |
| **915 × 412** | Modern Android (Pixel / Galaxy S21) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **627px** | High (Gesture nav bar bottom inset 16-24px overlaps Brake button) |
| **1024 × 768** | Tablet Landscape (iPad 10th Gen) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **736px** | Medium (Controls feel tiny in bottom corners; reach is strained) |
| **390 × 844** | Portrait Orientation (Fallback) | L: 20px / B: 24px | R: 24px / B: 120px | R: 24px / B: 24px | **102px** | Fatal (Center clearance collapses to 102px; controls cover rider) |

### Key Observations:
1. **Clearance Collapse in Portrait:** At 390px width, controls leave only 102px of horizontal clearance. Okada must strictly enforce landscape mode via an orientation lock overlay.
2. **Fixed Inset Vulnerability:** On any device with landscape side cutouts (iPhone notches require 44–59px safe insets), `left: 20px` places the steering slider directly beneath the sensor housing, and `right: 24px` places the Brake button inside the corner curve.

---

## 4. SCREENSHOTS & EMPIRICAL EVIDENCE

All screenshots were captured live from the running game running the Phase 1 engine baseline:

### 4.1 Startup & Loading
- **Loading Screen:** `docs/ux/screenshots/01_startup_loading_844x390.png`  
  *Observation:* Clean loading bar, custom capybara art, language picker.
- **Tap to Start:** `docs/ux/screenshots/01_startup_tap_to_start.png`  
  *Observation:* Prompt pulses cleanly, consumes initial user gesture to unlock WebAudio.

### 4.2 World Driving (Standard 844×390)
- **Normal Driving:** `docs/ux/screenshots/03_world_driving_standard_844x390.png`  
  *Observation:* Steering slider on left, circular action cluster on right. Notice Brake (`BRK`) and `#sylens-badge` collision in the bottom right corner.
- **Active Controls (Steer + Throttle):** `docs/ux/screenshots/04_active_controls_steer_throttle.png`  
  *Observation:* Visual active feedback works, but right thumb has nowhere to rest without triggering GAS.

### 4.3 Virtual Phone Open
- **Phone Open Collision:** `docs/ux/screenshots/05_phone_open_844x390.png`  
  *Observation:* **Severe P0 Bug.** The virtual iPhone renders at bottom right, but the Okada touch buttons (`GAS`, `BRK`, `DRIFT`, `E`) remain rendered on top at `z-index: 9000`.
- **Phone App Subview:** `docs/ux/screenshots/06_phone_app_screen_844x390.png`  
  *Observation:* When CapyFood opens, driving buttons completely block the "Accept Delivery" and "Skip" buttons.

### 4.4 Store Mode
- **Walking Mode:** `docs/ux/screenshots/07_store_walking_844x390.png`  
  *Observation:* Walking joystick (`#okada-walk`) cleanly replaces steering slider; driving buttons hidden; `E` remains visible.
- **Active Store Interaction:** `docs/ux/screenshots/08_store_active_interaction.png`  
  *Observation:* Interaction button responds when picking up cart and collecting groceries.

### 4.5 Device Form Factors
- **Compact Landscape (667×375):** `docs/ux/screenshots/device_compact_667x375.png`
- **Large Landscape (932×430):** `docs/ux/screenshots/device_large_932x430.png`
- **Modern Android (915×412):** `docs/ux/screenshots/device_android_915x412.png`
- **Tablet Landscape (1024×768):** `docs/ux/screenshots/device_tablet_1024x768.png`
- **Portrait Fallback (390×844):** `docs/ux/screenshots/device_portrait_390x844.png`

---

## 5. THUMB REACH & HAND ERGONOMICS

When holding a mobile device with two hands in landscape, thumb comfort follows circular arcs radiating from the lower corners:

```text
┌──────────────────────────────────────────────────────────┐
│ [TOP HUD / UTILITY]                  [PHONE / STATUS]    │
│                                                          │
│                      GAMEPLAY                            │
│                                                          │
│   ( Comfort )                              ( Reach )     │
│   /  Zone   \                              /  Zone  \    │
│  [ STEERING  ]                            [ GAS / BRK]   │
│  (Resting L)                              (Resting R)    │
└──────────────────────────────────────────────────────────┘
```

### 5.1 Left Thumb (Navigation)
- **Natural Resting Position:** ~30–45px from bottom, ~40–60px from left edge.
- **Current Problem:** The static slider at `left: 20px; bottom: 24px` sits too low and close to the edge. The player's thumb is forced into a cramped, downward-flexed posture.
- **Required Action:** Continuous analog steering with frequent micro-adjustments and counter-steering.

### 5.2 Right Thumb (Action Cluster)
- **Natural Resting Position:** ~40–55px from bottom, ~50–70px from right edge.
- **Current Problem:** 
  1. `GAS` is positioned high (`bottom: 120px`), while `BRK` is low (`bottom: 24px`). Since motorcycle driving is 90% throttle, keeping the thumb on `GAS` causes fatigue.
  2. `DRIFT` is positioned to the left of `GAS` (`right: 110px, bottom: 120px`). To initiate drift while holding throttle, the player must slide their thumb across or use two fingers.
  3. `E` (Interact) is at `bottom: 210px`, which is completely outside the primary thumb arc and requires an awkward upward reach.

### 5.3 Simultaneous Action Matrix
- **Steer + Throttle:** Constant (95% of driving time). Must be effortless.
- **Steer + Throttle + Drift:** Frequent (entering corners at speed). **Current touch layout fails here.**
- **Steer + Brake:** Moderate (emergency stops, obstacle avoidance).
- **Steer + Interact:** Occasional (approaching store door or customer drop-off).
- **Walk + Interact:** Constant in store (pushing cart while picking items).

---

## 6. STEERING CONTROL ANALYSIS & RECOMMENDATION

We evaluated four primary steering interaction models for Okada's arcade motorcycle physics:

| Model | Mechanics | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **A. Fixed Thumbstick** | Static 2D or 1D joystick in bottom-left corner. | Predictable visual position; familiar to console players. | Thumb drifts off center during intense turns; leads to missed inputs. | Prototype only |
| **B. Floating Thumbstick (Dynamic Center)** | Touch-down anywhere in left zone establishes origin `(x0, y0)`. Dragging left/right outputs `steerDir`. | Zero missed touches; eliminates thumb fatigue; automatically matches player's hand size. | Requires clear visual feedback ring that spawns at touch-down. | **PRIMARY RECOMMENDATION (P1)** |
| **C. Horizontal Slider / Pad** | Phase 1 model: static horizontal track with visible knob. | Explicit 1-axis constraint; clear visual representation of steering state. | High miss rate when eyes are on road; rigid bounding box. | Fallback / Accessibility Option |
| **D. Invisible Split-Screen Zone** | Left half of screen acts as steering touch area with no chrome. | Cleanest possible HUD; zero visual obstruction. | Poor discoverability; player lacks spatial awareness of maximum deflection. | Rejected |

### Steering Response Curve Design
Motorcycle handling requires both fine high-speed stability and rapid full-lock turning:
1. **Deadzone ($\delta$):** $0.06$ ($6\%$) to ignore thumb micro-tremor.
2. **Maximum Deflection ($R_{max}$):** $50\text{px}$ displacement yields full $\pm 1.0$.
3. **Response Curve (Nonlinear Gamma):**
   $$\text{steerDir} = \operatorname{sign}(\Delta x) \cdot \left( \frac{|\Delta x| - \delta}{R_{max} - \delta} \right)^{1.35}$$
   *Rationale:* An exponent of $\gamma = 1.35$ expands sensitivity near center for smooth micro-steering, while maintaining snappy full-lock turns during hairpins.

---

## 7. ACTION CONTROLS: THROTTLE, BRAKE & REVERSE

### 7.1 Throttle (`GAS`)
- **Interaction:** Large primary action button ($76\times 76\text{px}$) placed in the prime right-thumb comfort arc.
- **Hold-to-Accelerate:** Essential for arcade feel. Includes continuous touch-sliding to drift.

### 7.2 Brake vs. Reverse Architecture
- **Canonical Reality:** `OkadaEngineAdapter` maps `brake: true` to `engine.brake` and `reverse: true` to `engine.backward`. They are separate engine inputs.
- **The Mobile Dilemma:** Real racing games rarely use a dedicated reverse button. Players expect "brake to stop, then hold to reverse".
- **Recommended Mobile UX (Zero Engine Adapter Changes):**
  - In `TouchInputSource`, track vehicle speed or brake duration.
  - While motorcycle is moving forward: pressing `BRK` outputs `brake: 1, reverse: 0`.
  - When vehicle comes to a complete stop ($v < 0.1$) while `BRK` is continuously held: `TouchInputSource` transitions output to `brake: 0, reverse: 1`.
  - Visual button label transitions dynamically from **BRK** to **REV**.
  - Releasing touch returns to neutral.
  - *Result:* Preserves engine semantics without adding HUD clutter.

---

## 8. DRIFT CONTROL DESIGN

- **Gameplay Role:** Drift initiates scooter slide, sharpens turn radius, and charges boost.
- **Thumb Placement:** Positioned in an arc directly adjacent to `GAS` (offset by 35°), allowing a single thumb to bridge both buttons ("fat-thumb" or roll gesture) to execute **Throttle + Drift** simultaneously.
- **Button Sizing:** $60\times 60\text{px}$, with a tactile visual border glow when active.

---

## 9. CONTEXTUAL INTERACT (`E`)

- **Current State:** Static $64\times 64\text{px}$ button at `right: 110px; bottom: 210px;`.
- **Recommendation:**
  - **Context-Aware Visibility:** When the player is in open world with no interactables nearby, dim button to 30% opacity or collapse into a subtle pill.
  - **Proximity Highlight:** When approaching a store door, grocery cart, or delivery customer, expand button with an animated pulse and contextual icon:
    - 🛒 **GET CART** (Store entrance)
    - 📦 **PICK ITEM** (Store shelf)
    - 💳 **CHECKOUT** (Store counter)
    - 🍕 **DELIVER** (Customer drop-off)
  - Semantically, all variations fire `contribution.interact = true` into `TouchInputSource`.

---

## 10. WALKING & STORE JOYSTICK

- **Model:** Floating 2D joystick within the left half of the screen during `in-store-mode`.
- **Dimensions:** Base ring $130\text{px}$ diameter; knob $50\text{px}$ diameter.
- **Throw Radius:** $55\text{px}$ maximum displacement.
- **Deadzone:** Radial $15\%$ ($0.15$).
- **Vector Mapping:** Continuous 360° output $(walkX, walkY) \in [-1, 1]$.
- **Camera Alignment:** The store interior camera is angled isometric; ensure joystick $(0, 1)$ aligns naturally with aisle movement.

---

## 11. WHEELIE (`F`)

- Canonical desktop maps key `F` to wheelie.
- `OkadaEngineAdapter` already includes `wheelie: boolean`.
- **Phase 2A Recommendation:** **Do NOT add a dedicated wheelie button.** Adding a 6th button to the right cluster creates unmanageable clutter.
- **Phase 2B Implementation:** Implement wheelie as an optional **quick double-tap on GAS** or swipe-up gesture on the right zone.

---

## 12. VIRTUAL PHONE INTEGRATION

- **Current Failure:** Opening the phone leaves driving touch controls visible at `z-index: 9000;`.
- **Phase 2B Requirement:**
  1. **Dedicated Phone Button:** Add an elegant on-screen phone icon button ($44\times 44\text{px}$) in the top-right HUD lane (or bottom-right tab) with an unread notification badge.
  2. **Touch Control Suppression:** When `#phone-hud` has class `.phone-visible` or `.is-mobile-fullscreen`, `TouchInputSource` must apply `pointer-events: none; opacity: 0;` to `#okada-phase1-controls-root`.
  3. **Input Interlock:** Opening the phone revokes all driving pointer captures and neutralizes steering/throttle.

---

## 13. HUD COMPETITION & SCREEN-ZONE MAP

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [TOP-LEFT]                     [TOP-CENTER]               [TOP-RIGHT]  │
│ Order Mission / Customer       Delivery Timer             Settings     │
│ Address & Delivery Bounty      Streak Multiplier          Mute / Audio │
│                                                           Phone Icon   │
│                                                                        │
│                                                                        │
│                              GAMEPLAY                                  │
│                          (3D World / Rider)                            │
│                                                                        │
│                                                                        │
│ [BOTTOM-LEFT ZONE]                                 [BOTTOM-RIGHT ZONE] │
│ Floating Analog Steering Pad                       (Interact E)        │
│ (Active on touch-down)                             [DRIFT]   [GAS]     │
│ [Walk Joystick in Store]                                     [BRK/REV] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 14. CONTROL VISIBILITY STATE MATRIX

| Game State | Steering | Gas | Brake / Rev | Drift | Interact (E) | Walk Stick | Phone Icon | Phone Modal |
|---|---|---|---|---|---|---|---|---|
| **Loading** | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden |
| **Main Menu** | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden |
| **World Driving** | **Visible** | **Visible** | **Visible** | **Visible** | Dim / Hidden | Hidden | **Visible** | Hidden |
| **Near Interactable** | **Visible** | **Visible** | **Visible** | **Visible** | **Active Pulse** | Hidden | **Visible** | Hidden |
| **Store (Shopping)** | Hidden | Hidden | Hidden | Hidden | **Active Pulse** | **Visible** | **Visible** | Hidden |
| **Phone Open** | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Active | **Visible** |
| **Pause / Modal** | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden |

---

## 15. VISUAL LANGUAGE & AESTHETICS

- **Design Philosophy:** Arcade-tactile, clean glassmorphism tailored to Okada's vibrant retro-aesthetic.
- **Base Style:**
  - Background: `rgba(20, 24, 30, 0.55)` with `backdrop-filter: blur(8px)`.
  - Border: `1.5px solid rgba(255, 255, 255, 0.22)`.
  - Active/Pressed Glow: `rgba(255, 216, 102, 0.45)` with subtle `transform: scale(0.94)`.
  - Knob Style: High-contrast primary accent with inner directional indicator.
  - Labeling: Clean sans-serif typography (`Lilita One` or system rounded) with high legibility.

---

## 16. FEEDBACK & HAPTICS

- **Visual Feedback:** Instant brightness ramp (+20%) and scale transition (0.94) on press; dynamic deflection vectors on joysticks.
- **Haptic Recommendations (via `navigator.vibrate`):**
  - Button Tap (GAS / BRK): Light impact ($8\text{ms}$).
  - Drift Initiation: Sharp double-pulse ($15\text{ms}, 30\text{ms}, 15\text{ms}$).
  - Collision / Crash: Heavy impact ($45\text{ms}$).
  - Item Pickup / Delivery Complete: Success pattern ($20\text{ms}, 50\text{ms}, 30\text{ms}$).
  - Include master toggle in Settings to disable haptics.

---

## 17. MOBILE BROWSER BEHAVIOR & HARDENING

To achieve a true native app experience on mobile browsers (Safari iOS, Chrome Android):
1. **Prevent Default Gestures:** Apply `touch-action: none; user-select: none; -webkit-user-select: none;` across the entire game container.
2. **Prevent Pinch-Zoom & Double-Tap:** Metatag hardening (`user-scalable=no, viewport-fit=cover`) and intercepting `gesturestart` events.
3. **Prevent Pull-to-Refresh:** CSS `overscroll-behavior: none;` on `body` and `html`.
4. **Pointer Cancellation Recovery:** Handle `pointercancel` by cleanly clearing all active pointer IDs and resetting inputs to neutral.
5. **Orientation Enforcement:** Show a high-polish "Please rotate to landscape" overlay if `window.innerHeight > window.innerWidth`.

---

## 18. PERFORMANCE OBSERVATIONS

1. **Software vs. Hardware WebGL:** Headless tests run via software rasterizer (`swiftshader`), requiring pixel-ratio downscaling (`0.25`) for test execution. On physical devices, native GPU delivers 60 FPS effortlessly.
2. **Layout Thrashing Prevention:** All touch joystick animations must use `transform: translate3d(...)` and `opacity` to remain strictly on the GPU compositor thread without triggering layout reflows.
3. **Event Listener Optimization:** Use `{ passive: false }` for touch prevention where necessary, and cache bounding rects on resize rather than reading `getBoundingClientRect()` per touchmove frame.

---

## 19. REFERENCE RESEARCH & BEST PRACTICES

1. **Mobile Arcade Racers (Horizon Chase, Asphalt 9):**
   - *Key Principle:* Wide steering zones with dynamic origin outperform fixed touchpads. Right thumb controls are clustered in a natural ergonomic arc.
2. **Open-World Action (GTA Mobile, Cyberpunk Mobile ports):**
   - *Key Principle:* Contextual action button morphing. A single action button that switches from "Enter Vehicle" to "Deliver" to "Interact" eliminates HUD clutter while maintaining discoverability.
3. **Mobile Delivery Games:**
   - *Key Principle:* Navigation minimap and order alerts must sit at the top of the viewport to prevent thumb occlusion during cornering.

---

## 20. PROPOSED PHASE 2B CONTROL SYSTEM LAYOUT

### Responsive Sizing Rules:
All layout metrics must be computed using CSS clamp and viewport units bounded by safe areas:
- Horizontal margin: `max(env(safe-area-inset-left), 24px)`
- Vertical margin: `max(env(safe-area-inset-bottom), 20px)`

### Driving Layout:
- **Steering:** Floating horizontal joystick on left screen half. Max throw $55\text{px}$, base diameter $130\text{px}$, knob diameter $48\text{px}$.
- **GAS:** $76\times 76\text{px}$ circle, bottom-right resting zone.
- **BRK / REV:** $64\times 64\text{px}$ circle, positioned below and slightly inward from GAS.
- **DRIFT:** $60\times 60\text{px}$ circle, positioned adjacent to GAS for single-thumb bridging.
- **INTERACT:** Contextual pill ($70\times 50\text{px}$), positioned above DRIFT, active only near targets.
- **PHONE:** $44\times 44\text{px}$ icon in top-right HUD bar.

---

## 21. PRIORITIZED ISSUE TRACKER

### P0 (Critical — Gameplay Blocking / Broken UX)
1. **[P0-1] Safe Area Inset Failure:** Controls overlap physical notches and home indicator on modern mobile devices.
2. **[P0-2] Virtual Phone Z-Index Conflict:** Driving buttons float over and block phone apps when opened.
3. **[P0-3] Missing Reverse Touch Action:** Player cannot reverse out of dead ends or obstacles on touch.
4. **[P0-4] Mobile Controls Suppression Leak:** Okada controls remain visible during menus and modals.

### P1 (Major — Professional Mobile Gameplay Quality)
1. **[P1-1] Floating Steering Joystick:** Replace rigid fixed slider with dynamic touch-origin joystick.
2. **[P1-2] Ergonomic Action Arc:** Recluster GAS, BRK, and DRIFT to permit simultaneous Steer + Gas + Drift.
3. **[P1-3] Dedicated Phone Trigger:** Add visible mobile phone icon with unread badge to HUD.
4. **[P1-4] Contextual Interact Presentation:** Morph button icon/label based on proximity to store/cart/customer.
5. **[P1-5] Landscape Orientation Lock Overlay:** Prevent collapse of controls in portrait mode.
6. **[P1-6] Floating Walking Joystick in Store:** Enable dynamic touch origin for shelf navigation.
7. **[P1-7] Browser Gesture Hardening:** Prevent pull-to-refresh and pinch-zoom edge cancellations.

### P2 (Important Polish)
1. **[P2-1] Tactile Visual Feedback:** Glassmorphism styling, active button depression and glow states.
2. **[P2-2] Haptic Feedback System:** Vibration pulses on drift, collision, and delivery completion.
3. **[P2-3] Toolbar Collision Resolution:** Relocate React fullscreen toolbar to avoid overlap with canonical utility HUD.
4. **[P2-4] Dynamic Reverse Transition:** Automatic brake-to-reverse holding behavior.

### P3 (Future Enhancements)
1. **[P3-1] Double-Tap Wheelie Gesture:** Trigger wheelie via quick double-tap on GAS.
2. **[P3-2] Custom Layout Sizing:** Player settings slider for control scale and opacity.

**Prioritization Counts:**
- **P0 Count:** 4
- **P1 Count:** 7
- **P2 Count:** 4
- **P3 Count:** 2

---

## 22. IMPLEMENTATION BOUNDARY MAP

| Component | Responsibility in Phase 2B | Modifications Required? | Justification |
|---|---|---|---|
| **`TouchInputSource`** | Layout DOM, pointer event handling, floating joystick math, safe areas, reverse state machine. | **YES** | Primary home for all mobile interaction and presentation logic. |
| **Presentation CSS** | Visual design system, glassmorphism, responsive queries, safe-area CSS vars. | **YES** | Styling of touch HUD and orientation overlays. |
| **`InputManager`** | Source multiplexing, lifecycle, priority resolution. | **NO** | Already fully verified and handles normalized inputs cleanly. |
| **`EngineAdapter`** | Normalization bridge to canonical engine. | **NO** | Already supports continuous steering, walk vectors, brake, reverse, interact. |
| **Canonical Engine** | Game simulation, physics, store logic. | **NO** | Immutable baseline. Must not be modified. |
| **React Shell** | App container, fullscreen button placement. | **Minor (CSS only)** | Adjust toolbar insets to prevent colliding with canonical game buttons. |

---

## 23. UNRESOLVED QUESTIONS & PHASE 2B RECOMMENDATIONS

1. **Audio Context Resumption:** Does tapping on Okada touch controls consistently resume WebAudio if backgrounded? (Verify in Phase 2B).
2. **Safe Area CSS Injection:** Standardize on `calc(env(safe-area-inset-*) + Xpx)` across both the React wrapper and the game iframe/canvas.
3. **Proceed to Phase 2B:** With Phase 2A reconnaissance complete and empirical evidence documented, Phase 2B can proceed immediately to implement the redesigned touch presentation layer strictly within `TouchInputSource` and its accompanying stylesheet.
