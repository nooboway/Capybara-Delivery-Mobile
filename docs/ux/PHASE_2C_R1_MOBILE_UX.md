# Phase 2C-R1 resume — mobile driving, orientation, audio, brand cleanup & shop

1. Verdict: R1 mobile-UX corrections implemented on top of the frozen R3 store-motion
   commit; no canonical bytes changed. Recommendation: READY FOR PHYSICAL R1 RETEST.
2. Starting HEAD: e805a9669fb579b683f4f9fee257036c4ab51d37 (the R3 commit).
3. R3 store-motion commit detected: e805a96 "fix(store): implement Ryder responsive
   motion policy".
4. Final local SHA: see commit `fix(mobile): complete Ryder physical-device UX corrections`.
5. Remote pushed: NO.
6. Canonical SHA: C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.
7. Canonical unchanged: YES (rechecked after the production build).
8. Production files modified: `src/lib/input/sources/touch.ts`,
   `src/lib/input/index.ts`, `public/capybara-game/index.html`.
9. R3 store-motion module modified: NO (policy, adapter and R3 tests untouched).
10. R3 tests unchanged and passing: `test_store_motion_policy.mjs` 23/23,
    `test_store_motion.mjs` 25/25.

## Approach

The unfinished Antigravity R1 patch was preserved and selectively re-applied. Its
three rejected hacks were NOT resurrected: the `store.update` wrapper, the
`clock.getDelta` pause hook, and the keyboard-fallback regression all lived in
`engine-adapter.ts`, which was left exactly as the frozen R3 baseline. The R1 UX
was layered onto the accepted `touch.ts`/`index.ts` instead.

## Part A/B — driving feel and right-hand actions

- Steering stays 1-axis with a broad left-side dynamic-origin zone; the guide/puck
  floats to the touch point. Tuning constants are exported.
- Shipped response is Candidate A (near-linear): deadzone 0.04, throw 60px, gamma
  1.0. Candidate B (gamma 1.15–1.2 precision curve) is exposed but not enabled,
  because it changes the accepted Phase-1 monotonic response baseline.
- No double smoothing: `TouchInputSource` maps displacement directly each tick and
  the canonical motorcycle already applies the only interpolation.
- HUD exclusion: `pointerdown` on the steering/walk zones is ignored when it lands
  on real UI (`#top-right-controls`, phone, mission, menu, shop).
- Right cluster unchanged and re-verified: largest GAS, tactile BRK, smaller REV,
  reachable DRIFT, universal ACTION; GAS, GAS+DRIFT, BRAKE and REVERSE all work
  simultaneously with steering. Acceleration lock is retained and still cleared on
  blur/visibility/phone/mode/orientation.

## Part C — orientation

Root cause of the real-device miss: the accepted detector used only
`innerHeight > innerWidth` inside the game frame, ignoring `screen.orientation`.
Now detection is multi-signal: `screen.orientation` primary, then iframe and parent
viewport aspect ratio, then `matchMedia("(orientation: portrait)")`, recomputed on
`resize`, `orientationchange` and visibility. Portrait raises the full-screen RYDER
barrier, hides controls, neutralizes input; landscape removes it with no reload.

Physical-device orientation verified: NO (automated stub only).

## Part D — mute

Root cause: the canonical bundle already wires `#btn-mute` (click toggles
`__capyAudio.setMuted` and swaps the on/off icons, persisting `capy.muted`). The
unfinished R1 patch added a SECOND toggle handler, so one tap toggled twice and mute
appeared dead. The clean re-application does not add a second handler; mute now
toggles exactly once per tap and the icon stays in sync (verified). Background/resume
icon re-sync is read-only and safe.

## Part E — pause

No safe canonical pause seam was found: `__capyGame` exposes no pause/paused API;
the only `setPaused` is the cinematic/music player; `clock.stop()` auto-restarts on
the next `getDelta`; the renderer animation loop has no exposed handle; menu
transitions are not a complete pause contract. Per the R1 rule, no timing hack was
invented and no pause UI was shipped. Pause remains a documented P1 blocker.

## Part F/G/H — branding, signature, shop

- No player-facing "Vibe Jam" text remains (the menu portal button is repurposed).
- The Vibe Jam award image is hidden.
- "Remastered by Sylens" is absent from the canonical bundle; nothing to remove.
- The old `⚡ sylens 2026` badge is replaced by `sylens studios ™` with a restrained
  liquid-glass treatment (backdrop-filter, thin highlight edge, soft inner
  highlight); it fades out during gameplay.
- The menu portal button becomes SHOP and opens a non-transactional "RYDER SHOP —
  Coming soon" shell with a working CLOSE. No payments, accounts or economy.

## Regressions

- R3 store-motion suites: unchanged, passing.
- Phase-1 baseline `verify-engine.mjs`: 40 pass / 0 fail.
- R1 suite `verify-phase2c-r1.mjs`: 29 pass / 0 fail.
- Input typecheck: pass. Production build: pass. Canonical SHA: unchanged.

## Evidence

Screenshots in `docs/ux/screenshots/`: `r1_menu.png`, `r1_sylens_glass.png`,
`r1_shop_button.png`, `r1_shop_shell.png`, `r1_driving_idle.png`,
`r1_steering_active.png`, `r1_gas_drift.png`, `r1_portrait.png`, `r1_mute.png`.
No pause overlay (pause not implemented).
