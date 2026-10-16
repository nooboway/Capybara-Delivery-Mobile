# Ryder native mobile controls — Phase 2E

The canonical engine remains the gameplay authority. Ryder now exclusively owns
the mobile control surface: geometry, pointers, visibility and lifecycle. The
retired hybrid implementation is replaced, rather than layered under another
overlay. `sources/touch.ts` is only a compatibility export.

## Input boundary

`RyderMobileControls → OkadaInputManager → OkadaEngineAdapter → world._lastInput`.
The manager retains its source-priority arbitration and the adapter retains native
keyboard fallback, tutorial interlock and descriptor restoration. `steer`,
`throttle`, `brake`, `reverse`, `drift`, `interact`, `walkX` and `walkY` are normalized
numeric intent. Phase 2E makes drift/interact 0..1 in the existing shared state;
the unchanged adapter translates those flags to canonical booleans. Legacy JS
truthy contributions are normalized at the manager boundary. No second gameplay
state, fake keyboard events or screen-tap injection exists in production.

The control layer never writes physics, positions, mission state or Rapier bodies.
Brake/Reverse reads only the finite primitive forward-speed number through the
existing `vehicle-state.ts` seam. Unknown speed means braking first. Enter reverse
at speed <=0.15; return to braking above 0.4; sample every 60 ms while held.

## Components and geometry

`mobile/ryder-mobile-controls.ts` owns the generation's root, UI state and source.
`PointerButton` supplies GAS, Brake/Reverse, Drift and Action ownership.
`FloatingJoystick` is the shared implementation for the mutually exclusive WORLD
and STORE movement surfaces. `layout.ts`, `state.ts`, `native-suppression.ts` and
`styles.ts` contain their respective responsibilities. Existing Phone, portrait,
studio signature and Shop presentation is preserved in `shell-styles.ts`.

`CONTROL_LAYOUT` is the only control-position configuration. The movement region
occupies 46% of usable width below its 30% vertical point. The right cluster uses
normalized anchors; width clamps to 230–300 px and height to 220–310 px. GAS size
clamps to 78–104 px, other actions scale with a 50 px minimum. The shared top HUD
uses 44 px targets and 8 px gaps. All positions resolve within visualViewport,
with fallback to iframe dimensions. Computed safe-area padding includes physical
insets and minimum margins. Embedded headers naturally reduce the iframe's usable
height; an outer-document safe-area probe also converts physical insets to
iframe-local coordinates without double-padding an already inset frame. The
existing Phone layout also accounts for the embed bar. Sizes are not
uniformly shrunk with the viewport. Future customization can replace validated
anchors without changing semantic actions; no customization UI is implemented.

The floating stick appears under the owning thumb and disappears on release.
Its puck has a circular 60 px gate. WORLD uses only X for steering, with 0.04
deadzone and linear response; Y never creates throttle or brake. STORE uses a
continuous circular XY vector, 0.18 radial deadzone and magnitude remapping.
The accepted WORLD full-horizontal response remains independent of vertical
thumb travel, while the visual puck stays inside the ring. R3 remains the store
stopping authority. There is no added smoothing.

## Pointer and UI ownership

Each joystick has one exclusive owner. Each digital action has a multi-owner set:
a second finger cannot steal the first or release its action. Pointerup,
pointercancel and lostpointercapture release only the owning pointer. Capture
release and source reset remove all owners before stale events can run.

**GAS lock is removed.** GAS is exactly 1 while owned and 0 after release/cancel.
Drift and Action follow the same hold/release contract. Brake and reverse are
mutually exclusive. Right-hand placement is Action, Drift, then Brake/Reverse
beside the larger GAS target. Canonical mission prompts/results sit above the
movement surface; the HUD and Phone occupy excluded geometry.

Phone, Menu and Mute share one HUD container. The actual canonical Menu and Mute
nodes are reversibly reparented, preserving their listeners and audio bridge.
Trusted pointerup activates their original click handlers once; compatibility
pointer clicks are consumed at the window boundary, including clicks retargeted
to a newly opened backdrop, to prevent double toggles or immediate modal dismissal.
A fresh pointerdown clears that suppression. Pointer coordinates only identify
duplicate browser events; they never produce screen-tap injection. Keyboard clicks remain
available. Close replaces Phone in the same HUD slot while Phone is open.
The parent-page iOS install hint is removed on Play so it cannot cover controls.
Canonical Menu confirmation dialogs enter MENU state, reset gameplay, and receive
a reversible touch-control marker so their native click-only buttons work.

## State and binding invariant

| State | Gameplay controls |
| --- | --- |
| BOOT | Hidden and inert |
| MENU | Hidden and inert |
| WORLD | Driving and Action, only with a current binding |
| STORE | Walking and Action, only with a current binding |
| PHONE | Hidden and inert; canonical Phone/apps own input |
| SHOP | Hidden and inert |
| PORTRAIT_BLOCKED | Hidden and inert; rotate prompt visible |
| DISCONNECTED | Hidden and inert |

Initialization attaches only an inert presentation. It polls every 250 ms until
the canonical input is ready or the generation is cancelled; there is no elapsed
time abandonment. Visibility requires an engine override, a live generation,
an undisposed handle and exact identity with the world's current `_lastInput`.
The controller checks that health before every gesture and on each animation
frame before painting. A failed identity check resets input and hides targets.
Phone close re-evaluates state and health; it never restores held intent.

Canonical tutorial locks are preserved. Gameplay targets remain hidden during
the cinematic/Phone introduction; the Phone HUD remains usable at the canonical
Phone step. During `teach_controls`, a trusted Ryder movement gesture invokes the
existing canonical mission transition. The narrow tutorial bridge also invokes
the existing Phone command/boot transition, since native listeners recognize
only original touch IDs and Phone DOM clicks. It never clears locks directly,
calls tutorial.complete(), fakes keys or advances unrelated tutorial states.

## Native suppression and lifecycle

`data-ryder-mobile` scopes CSS suppression of native gameplay controls and their
hit targets. A capture guard prevents native touch listeners acquiring Ryder
gameplay gestures or canvas touch movement. Canonical Phone/apps, menu and audio
gestures are exempt. Desktop keyboard listeners remain intact. Native nodes and
source code are never deleted. Disposal restores the previous ownership
attribute and the original HUD locations.

One AbortController owns component/window/document/viewport listeners. One
MutationObserver observes UI changes; one rAF checks DOM/input identity. Neither
reads bike or physics telemetry. Resize, orientation, blur, hidden visibility,
state changes, Phone opening, binding loss and teardown reset gameplay intent.
Orientation uses screen orientation when available, with viewport, parent and
media-query fallbacks; real orientation changes and visualViewport changes
re-layout and require fresh physical input.

Disposal is idempotent: reset actions, release captures, cancel the brake timer
and rAF, disconnect the observer, abort listeners, restore HUD/native ownership
and remove owned DOM/styles. The existing initializer's generation map and React
iframe onLoad dispose document A before binding document B. No old pointer or
old asynchronous initialization can win the new generation.

## Verification and physical gate

Store layout uses the same centralized geometry resolver with a state-specific
ACTION anchor at the lower right and the shared HUD at the upper left. This keeps
both clear of the canonical shopping list and timer. The layout is recalculated
when the UI state changes, as well as on viewport changes; no store mechanics or
canonical HUD nodes are modified to make room.

`verify-phase2e-layout.mjs` checks normalized geometry, collision bounds, safe
areas and all eight states. `verify-phase2e-native-controls.mjs` serves the actual
built React application, keeps its original iframe initialization and uses trusted
touch controls. Its runtime companion checks hit targets, multitouch, orientation,
binding loss, lifecycle and attempts the full actual delivery route. The natural
first-order tutorial is included without tutorial.complete() or lock removal.
The returning-player profile seeds only the canonical completed-tutorial storage
version; offer scheduling is an explicit fixture. Vehicle, walker, collection and
mission completion are never assigned by the Phase 2E delivery navigator.

The older Phase 1 store suite retains its documented spatial/required-item
fixtures and must not be described as a touch-driven road-route test. The
Phase 2E report records the actual outcomes and any incomplete gates. Chromium
touch emulation cannot establish physical iPhone Safari acceptance. Real-device
driving feel, browser chrome/safe areas and rotation remain a user retest gate.
