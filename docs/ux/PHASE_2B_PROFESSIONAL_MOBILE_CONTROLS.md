# Okada — Phase 2B: Professional Mobile Control Implementation

## Executive Summary

Phase 2B transitions Okada's verified Phase 1 input architecture into the project's first production-grade mobile touch control system. Designed specifically for landscape mobile gameplay, Phase 2B preserves 100% byte-identity of the canonical engine (`C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`) while completely overhauling the touch presentation, ergonomics, pointer ownership, and lifecycle mechanics within `TouchInputSource`.

All 40 Phase 1 baseline integration tests and all 37 Phase 2B touch-layer verification tests pass (77 total automated checks, 0 failures).

---

## 1. What Changed and Why

### Deficiencies in Phase 1 Diagnostic Touch Overlay
1. **Rigid Static Sliders**: Steering in Phase 1 required players to locate an arbitrary fixed horizontal bar on the bottom-left screen. If the player's thumb missed the bar or drifted slightly, input was lost or ignored.
2. **Missing Semantic Controls**: Reverse (`reverse: 1`) existed in the Phase 1 normalized input schema but lacked a dedicated touch element, requiring players to rely on keyboard fallback.
3. **Cluttered Right-Thumb Zone**: Action buttons were uniformly sized in a vertical stack without visual hierarchy or thumb arc ergonomics, causing missed touches during high-speed navigation.
4. **Phone Input Collisions**: When the virtual phone was opened, touch controls remained active and intercepted touches intended for the smartphone interface (z-index and pointer ownership collision).
5. **Lack of Orientation Barrier**: When a phone rotated to portrait, controls were compressed into unusable layouts without clear player feedback.
6. **Hardcoded Offsets**: Edge distances ignored hardware notches, Dynamic Islands, and system gesture bars.

### Phase 2B Solutions
- **Dynamic-Origin Floating Steering (1-Axis)**: Left-side touches instantiate a dynamic steering anchor directly beneath the thumb. Displacement along the X-axis continuously outputs `steer ∈ [-1, 1]`. Vertical thumb motion does not affect steering.
- **Continuous 2D Dynamic Walking Joystick**: Replaced the fixed store controls with a floating 2D virtual thumbstick (`walkX ∈ [-1, 1]`, `walkZ ∈ [-1, 1]`), permitting smooth non-cardinal diagonal movement.
- **Ergonomic Right-Thumb Cluster**:
  - Dominant **GAS** throttle control (hold-to-accelerate).
  - Dedicated **BRAKE** control positioned adjacent to GAS for rapid deceleration.
  - Dedicated **REV** (Reverse) control positioned above brake for precise maneuvering.
  - **DRIFT** control positioned along the natural thumb arc for simultaneous Steer + GAS + DRIFT.
  - Universal **INTERACT** button that expands and highlights during store shopping.
- **Acceleration Lock (Experimental Mobile Feature)**: Continuous hold of GAS for 1,000ms latches throttle to `1`, allowing the player to release their thumb during long highway deliveries. Tapping GAS instantly clears the lock. Lock automatically clears on mode changes, phone activation, blur, visibility loss, and reset.
- **Virtual Phone Input Suppression**: Clicking the PHONE trigger adds `.phone-open` to the root overlay, revokes all active pointer ownership, sets `opacity: 0` and `pointer-events: none`, allowing the canonical phone canvas/iframe to receive 100% of player interactions.
- **Portrait Orientation Barrier**: Activates a clean overlay (`#okada-portrait-barrier`) prompting "ROTATE DEVICE TO PLAY" when viewport height exceeds width, neutralizing game inputs.
- **Safe Area Integration**: Sizing and margins utilize `env(safe-area-inset-*)` combined with CSS `clamp()` functions to guarantee usability across compact phones, standard devices, large phablets, and tablets.

---

## 2. Visual Architecture & Layout

### Driving Mode HUD Layout
```text
+------------------------------------------------------------------------------------+
|  [PHONE TRIGGER]                                              [CANONICAL HUD]     |
|                                                                                    |
|                                                                                    |
|   LEFT SCREEN: DYNAMIC STEERING REGION                  RIGHT SCREEN: ACTION CLUSTER|
|                                                                                    |
|   +--------------------------+                                  [REV]              |
|   |                          |                            [DRIFT]     [BRAKE]      |
|   |    (Dynamic Thumb)       |                                                     |
|   |          O               |                                 [  GAS  ]           |
|   |      <---|--->           |                                                     |
|   |                          |                               [INTERACT]            |
|   +--------------------------+                                                     |
+------------------------------------------------------------------------------------+
```

### Store Mode HUD Layout
```text
+------------------------------------------------------------------------------------+
|  [PHONE TRIGGER]                                              [CANONICAL HUD]     |
|                                                                                    |
|   LEFT SCREEN: STORE REGION                             RIGHT SCREEN: ACTION CLUSTER|
|                                                                                    |
|   +--------------------------+                                                     |
|   |                          |                                                     |
|   |       (2D Joystick)      |                                                     |
|   |            ^             |                                                     |
|   |         <--O-->          |                               [ INTERACT ]          |
|   |            v             |                               (Prominent)           |
|   |                          |                                                     |
|   +--------------------------+                                                     |
+------------------------------------------------------------------------------------+
```

---

## 3. Control Mechanics & Behavior

### 3.1 Dynamic-Origin Floating Steering (1-Axis)
- **Activation Region**: Left half of the viewport (`width: 48vw`, `height: 72vh`, bottom-left bounded).
- **Origin Establishment**: The exact `clientX` of the initial `pointerdown` sets `originX`. Visual track (`#okada-steer-track`) and knob (`#okada-steer-knob`) appear centered at the touch point.
- **Pointer Ownership**: The `pointerId` is captured exclusively. Secondary touches within the steering zone cannot hijack or corrupt the active steering session.
- **Displacement Mapping**:
  $$\text{deltaX} = \text{clientX} - \text{originX}$$
  $$\text{normalized} = \text{clamp}\left(\frac{\text{deltaX}}{\text{STEER\_MAX\_THROW}}, -1, 1\right)$$
  $$\text{magnitude} = |\text{normalized}|$$
  $$\text{effective} = \begin{cases} 0 & \text{if } \text{magnitude} < \text{STEER\_DEADZONE} \\ \frac{\text{magnitude} - \text{STEER\_DEADZONE}}{1 - \text{STEER\_DEADZONE}} & \text{otherwise} \end{cases}$$
  $$\text{steer} = \text{sign}(\text{deltaX}) \cdot (\text{effective})^{\text{STEER\_RESPONSE\_EXPONENT}}$$
- **Neutral Reset**: `pointerup`, `pointercancel`, `lostpointercapture`, or blur immediately resets `steer = 0` and hides the visual slider.

### 3.2 2D Dynamic Store Walking Joystick
- **Activation Region**: Left half of the viewport during `.in-store-mode`.
- **Radial Vector Calculation**:
  $$\text{dx} = \text{clientX} - \text{originX}, \quad \text{dy} = \text{clientY} - \text{originY}$$
  $$\text{dist} = \sqrt{\text{dx}^2 + \text{dy}^2}, \quad \text{clampedDist} = \min(\text{dist}, \text{WALK\_MAX\_THROW})$$
  $$\text{walkX} = \frac{\text{dx}}{\text{dist}} \cdot \text{normalizedRatio}, \quad \text{walkZ} = \frac{\text{dy}}{\text{dist}} \cdot \text{normalizedRatio}$$
- **Full Diagonal Freedom**: Unlike digital D-pads, the player can smoothly navigate store aisles at arbitrary angles (e.g. `walkX: 0.54, walkZ: -0.68`).

### 3.3 Right-Thumb Action Cluster
- **GAS (`#okada-btn-throttle`)**: Primary drive button, sized responsively via `clamp(70px, 14vw, 88px)`.
- **BRAKE (`#okada-btn-brake`)**: Dedicated deceleration button, positioned to the left of GAS.
- **REV (`#okada-btn-reverse`)**: Dedicated reverse button, positioned above BRAKE for clean 3-point turns.
- **DRIFT (`#okada-btn-drift`)**: Positioned on the inner thumb arc, accessible while holding GAS.
- **INTERACT (`#okada-btn-interact`)**: Universal action button for vehicle mounting, picking orders, carts, items, and checkout.

### 3.4 Acceleration Lock
- **Operation**:
  - Holding GAS continuously for `GAS_LOCK_HOLD_MS` (1,000ms) triggers the locked state (`isGasLocked = true`).
  - Button visual state transitions to `.locked` (vibrant amber glow with pulsing indicator).
  - When the player lifts their thumb, `throttle` remains latched at `1.0`.
  - Tapping the GAS button at any time immediately disengages the lock and returns `throttle` to `0`.
- **Lifecycle Clearing**:
  - Automatically cleared on `reset()`.
  - Automatically cleared on mode transition (e.g., entering store, opening phone).
  - Automatically cleared on window `blur`, `visibilitychange` (hidden), or `orientationchange`.

### 3.5 Virtual Phone Handling & Suppression
- **Trigger**: Touching the PHONE button triggers the game's phone interface.
- **Input Suppression**:
  - Adds `.phone-open` to `#okada-phase1-controls-root`.
  - Applies `opacity: 0 !important; pointer-events: none !important;` to touch controls.
  - Clears all active pointer captures and zeroes all gameplay inputs (`steer: 0, throttle: 0, brake: 0, reverse: 0, walkX: 0, walkZ: 0`).
  - Clears acceleration lock.
- **Restoration**: Closing the phone via in-game controls or `Tab` key removes `.phone-open`, restoring HUD elements cleanly without restoring stale input state.

### 3.6 Safe Areas & Responsive Viewport Rules
- CSS tokens leverage CSS environment variables with bounded fallbacks:
  ```css
  :root {
    --okada-safe-top: max(env(safe-area-inset-top, 0px), 12px);
    --okada-safe-right: max(env(safe-area-inset-right, 0px), 16px);
    --okada-safe-bottom: max(env(safe-area-inset-bottom, 0px), 14px);
    --okada-safe-left: max(env(safe-area-inset-left, 0px), 16px);
  }
  ```
- Button sizes and gaps utilize `clamp()`:
  - Standard action buttons: `clamp(46px, 9vw, 58px)`.
  - Primary GAS button: `clamp(70px, 14vw, 88px)`.
  - Margins adjust dynamically to avoid phone camera notches and navigation pills.

### 3.7 Portrait Orientation Barrier
- Monitors `window.innerHeight > window.innerWidth` via resize and orientation listeners.
- Displays `#okada-portrait-barrier`:
  - Visual: Rotating phone graphic, clear prompt "ROTATE DEVICE TO PLAY", subtext "Okada requires landscape mode for delivery navigation."
  - Adds `.is-portrait` to controls root, disabling and hiding all gameplay controls.

---

## 4. Screenshot Evidence

All screenshots captured during automated verification runs and persisted in `docs/ux/screenshots/`:

| Screenshot File | Description | Viewport |
| :--- | :--- | :--- |
| `phase2b_world_idle_844x390.png` | Standard World Idle State | 844 × 390 (iPhone 14) |
| `phase2b_active_steering.png` | Active Dynamic Steering (Thumb down & deflected) | 844 × 390 |
| `phase2b_gas_locked.png` | Acceleration Lock Active (Amber glow indicator) | 844 × 390 |
| `phase2b_steer_gas_drift_active.png` | Simultaneous Multitouch (Steer + GAS + DRIFT) | 844 × 390 |
| `phase2b_store_walking.png` | Store Mode 2D Walking Joystick & Prominent Interact | 844 × 390 |
| `phase2b_phone_open_844x390.png` | Virtual Phone Active (HUD suppressed & pointer-events none) | 844 × 390 |
| `phase2b_portrait_barrier.png` | Portrait Mode Barrier Screen | 390 × 844 |
| `phase2b_device_compact_667x375.png` | Compact Landscape Viewport | 667 × 375 (iPhone SE) |
| `phase2b_device_large_932x430.png` | Large Landscape Viewport | 932 × 430 (iPhone 14 Pro Max) |
| `phase2b_device_android_915x412.png` | Android Landscape Viewport | 915 × 412 (Pixel 7) |
| `phase2b_device_tablet_1024x768.png` | Tablet Landscape Viewport | 1024 × 768 (iPad Mini) |

---

## 5. Automated Verification Results

### Suite 1: Phase 1 Frozen Baseline (`verify-engine.mjs`)
- **Layer A (Canonical Integrity)**: SHA-256 hash match (`C7E6C0AE...`), file size match (`6,588,195` bytes), AST acorn/esbuild parsing pass.
- **Layer B (Input Engine Interlock)**: Normalized manager dispatch, native keyboard fallback, descriptor restore.
- **Layer C (Touch Source Events)**: Pointer ownership, multi-touch isolation, source reset, mode visibility.
- **Layer D (Lifecycle & Idempotency)**: Clean attach, detach, reattach, dispose idempotency.
- **Layer E (Canonical Store Interaction)**: Full delivery gameplay loop inside canonical store.
- **Result**: **40 pass / 0 fail**

### Suite 2: Phase 2B Touch Control Verification (`verify-phase2b.mjs`)
- **DOM & Structure**: All 10 control elements, style element, and portrait barrier present.
- **Steering**: Dynamic origin establishment, fractional output (+0.5), full lock output (-1.0), second pointer rejection, neutral release.
- **Throttle & Lock**: Normal press/release, 1000ms hold activation, release persistence, tap cancellation.
- **Brake & Reverse**: Dedicated brake (`brake: 1, reverse: 0`), dedicated reverse (`reverse: 1, brake: 0`).
- **Drift**: Dedicated drift toggle (`drift: true`).
- **Multitouch**: Simultaneous Steer + GAS + DRIFT, drift release preserving steer and gas.
- **Store Mode**: Store mode displays walking joystick, hides driving cluster, continuous diagonal vector, simultaneous walk + interact.
- **Virtual Phone**: Phone trigger click suppresses controls (`opacity: 0`, `pointer-events: none`), neutralizes input, phone close restores controls without stale state.
- **Portrait Barrier**: Activates barrier, hides controls when `height > width`.
- **Responsive & Safe Area**: Viewport matrix scaling (667x375, 844x390, 932x430, 915x412, 1024x768) and CSS `env(safe-area-inset-*)` present.
- **Result**: **37 pass / 0 fail**

**Combined Verification Total: 77 pass / 0 fail**

---

## 6. Tuning Parameters for Phase 2C Physical-Device Playtesting

All tuning parameters are exposed as documented constants at the top of `TouchInputSource` (`artifacts/capybara-delivery/src/lib/input/sources/touch.ts`) for calibration on real mobile devices:

| Constant | Current Value | Physical Device Calibration Target |
| :--- | :--- | :--- |
| `STEER_DEADZONE` | `0.05` (5%) | Calibrate against thumb tremble / micro-wobble during straight-line riding. |
| `STEER_MAX_THROW` | `60px` | Calibrate against physical thumb reach across standard phone screen widths. |
| `STEER_RESPONSE_EXPONENT` | `1.0` | Test non-linear response curves (`1.2`–`1.4`) for fine micro-adjustments at center. |
| `WALK_DEADZONE` | `0.18` (18%) | Prevent accidental walking drift when resting thumb on store screen. |
| `WALK_MAX_THROW` | `46px` | Calibrate knob travel relative to base diameter (`140px`). |
| `GAS_LOCK_HOLD_MS` | `1000ms` | Test whether 800ms vs 1200ms feels more natural without false activations. |
| `GAS_LOCK_ENABLED` | `true` | Toggleable flag to disable acceleration lock if physical playtesting proves adverse. |
| `ACTION_CLUSTER_BOTTOM` | `clamp(...)` | Fine-tune thumb resting angle relative to device bottom bevel and home bar. |

---

## 7. Noteworthy Engineering Decisions

1. **NTFS Directory Junction Architecture**:
   `C:\Users\dev\Documents\Okada` is established as an NTFS Junction pointing to `C:\Users\dev\.gemini\antigravity-ide\scratch\Capybara-Delivery-Mobile`. All file modifications and git operations synchronize seamlessly across both paths.
2. **Strict Pointer Ownership Isolation**:
   By using `pointerId` tracking on dynamic controls (`activeSteerPointerId`, `activeWalkPointerId`), multitouch conflicts are prevented. Secondary fingers tapping gas or drift cannot redirect or cancel steering.
3. **Hardware Acceleration via Transforms**:
   Steering knobs, tracks, and joysticks utilize CSS `transform: translate3d(...)` rather than `top`/`left` mutations to ensure consistent 60fps rendering without triggering browser layout thrashing.
4. **Complete Phone Isolation**:
   Rather than attempting complex z-index layering, the touch HUD completely yields interaction ownership (`pointer-events: none`) to the phone canvas/iframe whenever `.phone-open` is active, completely resolving the Phase 2A interaction collision.
