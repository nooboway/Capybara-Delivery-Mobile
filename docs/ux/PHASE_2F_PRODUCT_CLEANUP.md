# Ryder Phase 2F — product cleanup

This pass changes Ryder-owned presentation and navigation. Phase 2E remains the control foundation. No Stats backend, persistent telemetry, purchasing, engine patch, deployment, push or merge is included. Physical iPhone Safari acceptance remains a human gate.

**Verdict: READY FOR PHYSICAL RETEST.** All required automated gates pass against the completed candidate. No remaining P0 was demonstrated by those gates; this is not a claim of physical Safari acceptance.

## Implementation

The product adapter owns rendered branding, promotional navigation, responsive menu/Phone presentation, and dismissible help. It observes DOM presentation only; it never reads or changes game/physics objects. Its observer settles without a mutation loop in the fixture. It is disposed on iframe replacement/unmount. InputManager, EngineAdapter, joystick, GAS, Brake/Reverse, Drift, Action, R3 motion policy, tutorial bridge, audio and immersive/PWA logic remain unchanged. The sole mobile-controller edit imports the exact shared credit constant.

Original logo artwork is replaced in the menu, intro, cinematic overlay and startup progress graphic. The progress mask based on the old silhouette is suppressed. Creator/VibeJam cinematic parent containers are hidden without changing the native cinematic timeline. Original strings remain in byte-identical canonical artifacts and historical documents; this is deliberate wrapper suppression rather than a bundle rewrite.

The menu has a general two-column landscape layout, a constrained internally scrolling selection pane and a sticky Play/Back footer. No cosmetic name drives layout. Actual choices are helmet (default), crown and witch; there is no separate no-cosmetic choice. Help/subtitle/control cards gain a 44×44 dismiss button. Dismissed signatures stay hidden, inert and outside hit testing for that iframe session; a genuinely different message may appear. This does not complete tutorials or clear canonical locks. Phone hides tips while open. Interaction copy adapts rendered English prompts and the separate store E keycap to mobile Action or desktop keyboard/Action, without rewriting native command caches, debug instructions or the cinematic Hold E to skip control.

Phone is centered below the existing upper HUD rail, with bounded dimensions, no transform stretching, internal content scrolling and a sticky offer action row. Gameplay controls retain Phase 2E's Phone-mode hiding and neutralization. The Stats route keeps the game iframe mounted and inert while its honest coming-soon shell is shown; Back to Game retains iframe identity. No fake metrics or backend calls exist.

`vercel.json` adds only a targeted `/stats` → `/index.html` rewrite so direct opening/refresh reaches the existing SPA. Build/install/output settings remain unchanged. Local verification serves the same route fallback; hosting configuration is checked separately in `evidence/phase2f-stats-hosting.log`. No Vercel deployment is performed in this phase.

## Required final report

| # | Item | Result |
| --- | --- | --- |
| 1 | Starting SHA | `a1d4e456b458780793e84f3c65a0ef5ffd78cf1b` |
| 2 | Final local SHA | The commit containing this report; exact SHA is returned in the final closure response. A commit cannot embed its own content-derived SHA. |
| 3 | Branch | `phase2f-product-cleanup` |
| 4 | Pushed | NO |
| 5 | Canonical SHA256 | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` |
| 6 | Canonical unchanged | YES |
| 7 | Correct credit | Exactly `Remixed by Sylens Studios ™`, shared constant and standalone HTML fallback. |
| 8 | Creator presents | Removed from rendered promotional cinematic UI with its empty backdrop. |
| 9 | Original branding remaining | Internal canonical bytes/localizations, compatibility IDs, retained Phone game app and historical provenance. Original project logos and promotional credits suppressed/replaced in player UI. |
| 10 | Heart support link | Removed from visible UI and href. |
| 11 | Heart behavior | Removed; no approved Ryder support destination found, no invented URL. |
| 12 | Original Stats URL | `https://capybara-vibejam26.leocoout.dev/stats`, no identity query parameters. |
| 13 | External Stats dependency | Removed from normal menu navigation; original canonical handler is intercepted. |
| 14 | Ryder Stats route | `/stats` in parent application. |
| 15 | Temporary Stats shell | YES, coming-soon text and Back to Game, no fake data. |
| 16 | Phone session leaderboard | Retained independent session-network ranking; canonical offline hiding retained. Live multiplayer ranking not claimed tested. |
| 17 | Original developer external links | No active normal player-facing support/social/Stats/sponsor destination. URLs remain internally in unchanged artifacts. Technical requests are classified separately in audit. |
| 18 | Legal attribution | License/copyright comments retained; no legal notice removed. Asset licensing not newly established. |
| 19 | Helmet Play | PASS at all eight sizes. |
| 20 | Crown Play | PASS at all eight sizes. |
| 21 | Witch Play | PASS at all eight sizes. |
| 22 | Default Play | Default is helmet, PASS. |
| 23 | Other cosmetics | Actual DOM enumerated exactly helmet/crown/witch; no additional or no-cosmetic option. |
| 24 | Sticky Play | General sticky internal action footer; outer game shell does not scroll. Touch target at least 44px. |
| 25 | Tip dismiss control | Explicit ×, 44×44px, accessible label. |
| 26 | Manual dismissal | Tips, subtitles and tutorial help presentation can be dismissed without modifying tutorial state. |
| 27 | Dismissed hit target | Removed using display:none, pointer-events:none and inert; repeated signature suppressed for session. Canonical opacity-zero auto-hiding also hides/disables the new close button, preventing an invisible hit target. |
| 28 | Press E replacements | Scoped rendered interaction text; desktop `Press E / Action`, standalone store keycap `E / Action`; native keyboard semantics unchanged. |
| 29 | Mobile Action | `Tap Action` for rendered Press/Tap/Use E interaction prompts and standalone store keycap. |
| 30 | Phone gameplay controls | Hidden/inert while Phone owns interaction, verified in all eight sizes. |
| 31 | Phone dimensions | Width min(82vw,680px,safe width); height min(82dvh,safe height minus HUD rail). 844×390 example: 680×294 at x82,y70. |
| 32 | Phone scrolling | Internal panes scroll; offer body bounded; outer scroll measured zero. |
| 33 | Accept/Skip | Both visible, unobstructed, at least 44px high. |
| 34 | Phone close | Visible and center-hit-tested outside Phone, HUD does not overlap. |
| 35 | Post-Phone controls | Same live bound handle, neutral before fresh touch; actual GAS acceleration verified. |
| 36 | Capy Food | Trusted Phone → app → offer → Accept → Close → drive flow passes. |
| 37 | Safe area | CSS uses existing safe inset variables; layout suite exercises inset variants. Physical Safari browser chrome still requires retest. |
| 38 | 667×375 | PASS cosmetics, Phone geometry, close, HUD and controls. |
| 39 | 740×360 | PASS. |
| 40 | 780×360 | PASS. |
| 41 | 844×390 | PASS; representative screenshot set. |
| 42 | 896×414 | PASS. |
| 43 | 932×430 | PASS. |
| 44 | Android landscape | 1080×480 PASS geometry/hit testing; not physical hardware evidence. |
| 45 | Tablet landscape | 1366×1024 PASS. |
| 46 | External URL audit | See architecture audit and product test log; no unexpected original-developer navigation or popups in tested flow. |
| 47 | Phase 2E regression | Production 62/62, layout 41/41 and lifecycle 24/24 PASS. Both first-time and returning sessions, full touch delivery, both 1,200-frame gates, disposal and reload pass. |
| 48 | Phase 1 | 40/40 PASS. |
| 49 | R3 | 23/23 PASS. |
| 50 | Phase 2D | 30/30 PASS. |
| 51 | Phase 2D-R1 | 33/33 PASS. |
| 52 | Audio | 12/12 PASS, including R1's actual playing music/SFX RMS mute checks. |
| 53 | Input startup | 8/8 PASS. |
| 54 | Tutorial bridge | 9/9 PASS. |
| 55 | Typecheck | Full application PASS; strict input/immersive/product PASS. |
| 56 | Build | Production Vite PASS; existing nonfatal tooltip sourcemap warning. |
| 57 | Runtime errors | ZERO in final product and complete production runs, including JavaScript/WASM; no Rapier aliasing/unreachable errors. Optional offline API/font request failures are separate. |
| 58 | Screenshots | `screenshots/phase2f/`: menu, branding, default/helmet/crown/witch, tip visible/dismissed, Phone home, Capy Food offer, accepted order, Stats shell, absent support and Action prompt; eight Phone sizes plus regression captures. |
| 59 | Docs | This report, `../architecture/RYDER_EXTERNAL_LINK_AUDIT.md`, `../architecture/RYDER_STATS_HANDOFF.md`. |
| 60 | Remaining P0 | None demonstrated by completed automated gates. Physical acceptance pending. |
| 61 | Remaining P1 | Physical iPhone Safari product layout, browser chrome, scrolling and restoration acceptance pending. No physical acceptance inferred. |
| 62 | Physical iPhone retest | REQUIRED. |
| 63 | Recommendation | READY FOR PHYSICAL RETEST. Stop; do not begin Phase 3A. |

## Evidence and limits

The final product suite passes **66/66**, including native auto-hidden close-button hit ownership. Menu, helmet, Phone home, Capy Food offer, accepted order, tip and Stats captures were visually reviewed. Capture waits for the startup overlay/menu hit readiness and the Phone app opening animation, avoiding transient title/splash frames.

| Suite/command under artifacts/capybara-delivery/scripts | Result | Evidence log under evidence/ |
| --- | --- | --- |
| `verify-phase2f-product-cleanup.mjs` | 66/66 PASS | `phase2f-product-cleanup.log` |
| `verify-phase2e-native-controls.mjs`, complete profile, both sessions | 62/62 PASS | `phase2f-phase2e-production.log` |
| `verify-phase2e-layout.mjs` | 41/41 PASS | `phase2f-verify-phase2e-layout.log` |
| `verify-phase2e-lifecycle.mjs` | 24/24 PASS | `phase2f-verify-phase2e-lifecycle.log` |
| `verify-engine.mjs` | 40/40 PASS | `phase2f-verify-engine.log` |
| `test_store_motion_policy.mjs` | 23/23 PASS | `phase2f-test_store_motion_policy.log` |
| `verify-phase2d.mjs` | 30/30 PASS | `phase2f-verify-phase2d.log` |
| `verify-phase2d-r1.mjs` | 33/33 PASS | `phase2f-verify-phase2d-r1.log` |
| `verify-ryder-audio.mjs` | 12/12 PASS | `phase2f-verify-ryder-audio.log` |
| `verify-input-startup.mjs` | 8/8 PASS | `phase2f-verify-input-startup.log` |
| `verify-tutorial-bridge.mjs` | 9/9 PASS | `phase2f-verify-tutorial-bridge.log` |
| Package `pnpm run typecheck` | Exit 0 | `phase2f-typecheck.log` |
| Strict tsc, ES2022/DOM, bundler resolution, input/index.ts + immersive.ts + product/index.ts | Exit 0 | `phase2f-input-typecheck.log` |
| Package `pnpm run build` | Exit 0 | `phase2f-build.log` |
| Targeted Stats hosting rewrite validation | PASS | `phase2f-stats-hosting.log` |

Browser checks use installed Chrome with normal GPU rendering and touch emulation. Product verification serves the actual built React shell and normal iframe initialization. Returning-player tutorial-completion storage version 2 and explicit Easy-offer scheduling are documented test fixtures; the offer timer is extended to 10000 for stable automation/capture, not production tuning. They do not replace production input or physics. A presentation-only subtitle fixture creates a real canonical prompt to check rendered wording/dismissal. Full touch delivery and first-time tutorial remain separate production regression gates. Fixture checks are labeled separately from production checks.

`PW_TEST_SCREENSHOT_NO_FONTS_READY=1` changes only screenshot font readiness waiting. `RYDER_SCREENSHOT_DIR` and `RYDER_EVIDENCE_PATH` send regression artifacts to new Phase 2F paths, preserving earlier evidence. Older-suite edits add the optional screenshot destination, move the store walking baseline before the movement gesture, and log before/after displacement. Behavioral assertions and thresholds are unchanged. The initial strict typecheck invocation through the junction failed at pnpm chdir with EPERM; direct TypeScript at the resolved package path passed without a source/config workaround.

The first contended production run failed its store diagonal displacement check after normal store entry; it had already passed both 1,200-frame gates and Phone/driving checks. The active stick capture and neutral final state are preserved in `screenshots/phase2f/regressions/store-joystick-active-attempt1.png` and `evidence/phase2f-phase2e-production-attempt1.log`. Inspection found that its initial position was sampled **after** movement had been sent. Remote browser scheduling can therefore omit the movement already completed before sampling. The test now samples before pointer acquisition and preserves the exact two-axis displacement/velocity/neutral assertions. Final suites run sequentially. No production input/gameplay change was made in response to this failure; the failed attempt is not counted as a pass.

Evidence logs under `evidence/phase2f-*` record individual suite totals and build/typecheck results. The product network run records the ephemeral local application origin and Google Fonts, with zero original support/Stats/promotional attempts/popups. Optional canonical sponsor/API requests may return 404 in an offline static harness. Legacy same-origin analytics is disabled by default on localhost; deployed analytics behavior and remote hosting overrides were not verified. The canonical Phone leaderboard module remains unchanged and independent; no claim of a live multiplayer backend test is made. See the link audit for these distinct systems and technical upstream asset fallbacks.

All 48 pre-existing modified/untracked files are checked against the preservation manifest before commit, including earlier screenshots, diagnostics and four read-only Stats audit artifacts. They remain outside this commit. No control semantics, canonical bundle, mission, physics, scoring, store policy or backend implementation is changed. Physical iPhone Safari retest is required before further phase acceptance. Stop after this local corrective commit.
