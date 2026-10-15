# Phase 2D — immersive mobile shell, final controls & copy cleanup

1. Verdict: implemented on top of the frozen R3 store-motion and accepted R1 work;
   canonical bytes unchanged. Recommendation: READY FOR PHYSICAL PHASE 2D RETEST.
2. Starting SHA: fd7ac74400d1da9891591857722d02257b337e32 (R1 commit).
3. Canonical SHA: C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.
4. Canonical unchanged: YES (rechecked after the production build).
5. Remote pushed: NO.

## Part A — immersive / fullscreen
- `src/lib/immersive.ts` runs in the shell realm and hooks the existing start
  gesture (tap-to-ride / Play). On that gesture it requests fullscreen on the game
  document (the iframe fills the screen) and attempts `screen.orientation.lock("landscape")`.
- Capability-based: checks `document.fullscreenEnabled`, `requestFullscreen`,
  `screen.orientation.lock`, `display-mode` and iOS `navigator.standalone`. No dead
  fullscreen button. Unsupported paths degrade to landscape browser play.
- `fullscreenchange` neutralizes input and re-dispatches resize.
- iOS/no-fullscreen: one-time "Add Ryder to Home Screen" hint, persisted dismissal
  (`ryder.a2hs.dismissed`), suppressed in standalone.
- PWA: `public/manifest.webmanifest` (display fullscreen, orientation landscape,
  Ryder name/short_name, theme/background, icons) linked from shell + game; added
  theme-color, apple-mobile-web-app-* and apple-touch-icon metadata. Shell uses
  `100dvh`; game viewport gains `viewport-fit=cover`.

## Part B — phone / HUD
- Dynamic viewport guard caps the landscape phone to `100dvh` / `92dvh` so browser
  chrome and safe areas cannot clip the close affordance or cover the world.
- Canonical phone close path is preserved; opening the phone still neutralizes
  driving input and closing restores control (verified).

## Part C — 360° floating joystick
- `#okada-steer` (bike) and `#okada-walk` (store) are broad left-side zones with a
  circular ring + puck that spawn under the thumb (dynamic origin) and vanish on
  release. Exposed tuning: deadzone, radial throw, X response, idle/active opacity.
- Bike: steer = horizontal component only; movement beyond the ring radius is
  clamped to the edge; vertical thumb movement never creates throttle/brake.
- Store: same joystick, full vector (diagonal preserved), R3 stop behaviour after release.

## Part D — combined BRAKE / REVERSE
- One right-thumb control replaces separate BRAKE + REV (label morphs BRAKE ⇄ REV).
- Speed signal: the single isolated `readForwardSpeed()` reader over the canonical
  bike dynamics snapshot (`world._bikeTelemetry.getDynamics().forwardSpeed`). No
  broad private physics exposure.
- State machine: forward motion above `BRAKE_REENTER_SPEED` (0.4) => brake; below
  `BRAKE_REVERSE_ENTER_SPEED` (0.15) => reverse; hysteretic (no flicker); never both;
  release => neutral. Thresholds derived from measured range (reverse ≈ −2.8,
  forward ≈ +5.3, brake deceleration ≈ 4/s). Physical testing remains authority.

## Part E — copy
- Subtitle is "A Game About Animals Delivering Food" across shell + game metadata.
- The embed bar (X player card) now reads "Ryder …" instead of "Okada …".
- No "Capybara Delivery" / "Okada" / "Capybaras Delivering Food" in player-facing UI.
  Internal identifiers (`OkadaInputManager`, asset filenames) remain for compatibility.

## Gates
- Input typecheck: pass. Production build: pass. Canonical SHA: unchanged.
- R3 store-motion policy unit 23/23 and integration 25/25 (frozen, unchanged).
- Phase-1 `verify-engine.mjs` 40/0 (updated: single combined BRAKE/REV; dynamic-origin walk).
- R1 `verify-phase2c-r1.mjs` 29/29 (updated for the combined control).
- Phase 2D `verify-phase2d.mjs` 30/30.

## Screenshots
`docs/ux/screenshots/`: `r2d_driving_idle.png`, `r2d_joystick_active.png`,
`r2d_brake_reverse.png`, `r2d_store_walk.png`.

## Known limitations / P1
- Real-device fullscreen, orientation lock, phone-after-accept and control feel are
  physical gates (not claimed from automation).
- On iOS there is no web fullscreen; the Add-to-Home-Screen hint is the fallback.
- Phase 3A (Stats/Leaderboards) has NOT begun (mandatory stop after 2D).
