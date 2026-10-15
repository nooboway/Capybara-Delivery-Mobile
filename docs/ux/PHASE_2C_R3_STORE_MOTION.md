# Phase 2C-R3 store-motion correction — implementation accepted

1. Verdict: store-motion correction implemented through the authorized Option D
   seam; no canonical bytes changed. Recommendation: READY FOR PHYSICAL STORE RETEST.
2. Starting HEAD: c7df3fb581b65ab332df8931619182bcd990e5fa.
3. Accepted Phase 2C baseline: 31413f808806460baebdbedfcfd739a43095664d; only
   subsequent commit is the deployment pnpm pin.
4. Final local SHA or NONE: NONE; HEAD unchanged, working tree carries R3 only.
5. Remote pushed: NO.
6. Canonical SHA: C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.
7. Canonical unchanged: YES; reconfirmed after the production build.
8. Working-tree preservation: the unfinished Antigravity R1 production patch
   (index.html, engine-adapter.ts, index.ts, input-manager.ts, sources/touch.ts)
   was isolated to r3-preserved and reverted in the working tree to the accepted
   baseline. Unaccepted R1 artifacts remain preserved outside the working tree.
9. Files changed by R3:
   - ADDED `artifacts/capybara-delivery/src/lib/ryder-store-motion-policy.ts`
   - MODIFIED `artifacts/capybara-delivery/src/lib/input/index.ts`
   - ADDED `artifacts/capybara-delivery/scripts/test_store_motion_policy.mjs`
   - REWRITTEN `artifacts/capybara-delivery/scripts/test_store_motion.mjs`
   - ADDED `docs/ux/evidence/r3-policy-unit.log`, `r3-store-motion-integration.log`
   - ADDED `docs/ux/PHASE_2C_R3_STORE_MOTION.md`; updated architecture policy doc.
10. EngineAdapter modified by R3: NO. The accepted baseline already falls back to
    the native getter whenever normalized walking is neutral.
11. InputManager modified by R3: NO.
12. TouchInputSource modified by R3: NO.
13. Canonical bundle modified: NO.
14. store.update wrapper used: YES — exactly one, and only through
    `installRyderStoreMotionPolicy`.
15. Canonical update executes exactly once: YES; verified by a prototype spy and a
    call-count delta of 1 per `store.update`.
16. Damping condition: only when the effective `input.walkVec` passed to canonical
    `store.update` is neutral (|x|,|z| <= 1e-6), the store `isActive`, and `dt` is
    finite and positive.
17. Touch-specific physics coupling: NONE.
18. Keyboard-specific physics coupling: NONE; the policy reads only the effective vector.
19. Keyboard fallback with touch/gamepad registered but inactive: WORKS; real
    Playwright keyboard W/A/S/D/arrows reach the engine `walkVec` while normalized
    touch state stays neutral.
20. Synthetic keyboard events: NONE produced or required.
21. Implemented damping value: `exp(-STORE_STOP_RATE * dt)`, `STORE_STOP_RATE = 28`,
    snap below `STORE_STOP_SPEED = 0.05` to exactly zero.
22. Practical stop target 100–200 ms: MET. Full-speed release 133.3 ms; diagonal
    release 150.0 ms; low-speed release 66.7 ms.
23. Sustained wall rebound eliminated: YES. Same scenario that leaves canonical
    motion (control final 2.0) rests at exactly 0 under the policy with no
    resurrection.
24. Active walking speed preserved: YES; held speed is not damped and equals the
    canonical post-step velocity exactly.
25. Direction-change responsiveness: YES; velocity sign flips on reversal.
26. Diagonal movement preserved: YES; held diagonal speed preserved, released rest
    within target.
27. Wrapper installation idempotent: YES; @refcounted WeakMap leases, one wrapper.
28. Dispose/reload restore + rebind: YES; `dispose()` restores the canonical
    descriptor and adapter getters; `pagehide` disposes; re-init installs a fresh
    wrapper with no stacking and canonical still once.
29. clock.getDelta pause mechanism: ABSENT from the accepted baseline and not treated
    as a completed pause system; no pause work was performed in R3.
30. Focused store-motion tests: `test_store_motion_policy.mjs` 23/23 PASS;
    `test_store_motion.mjs` 25/25 PASS.
31. Accepted input regression suite: `verify-engine.mjs` 40 PASS / 0 FAIL
    (includes the store-interaction module).
32. Input typecheck: PASS (`tsc -p tsconfig.json --noEmit`).
33. Production build: PASS (`vite build`, 1773 modules; policy strings present in
    the emitted app bundle; canonical asset untouched).
34. Screenshots: no new captures; R1 visual capture is out of R3 scope.
35. Remaining P0: none established.
36. Remaining P1: real-device/physical store feel; broader unaccepted R1 UX
    (driving polish, orientation, mute, pause, Sylens glass, Shop) remains out of
    scope and unaccepted.
37. Physical store feel verified: NO — that is the retest this report recommends.
38. Documentation paths: this file; `docs/architecture/RYDER_STORE_MOTION_POLICY.md`;
    `docs/ux/evidence/r3-policy-unit.log`; `docs/ux/evidence/r3-store-motion-integration.log`.
39. Recommendation: READY FOR PHYSICAL STORE RETEST.

## What was preserved vs changed in the working tree

The unfinished R1 production patch is preserved byte-for-byte in
`C:/Users/dev/Documents/Codex/2026-10-11/files-pasted-by-the-user-i/r3-preserved`
(patch, status, per-file hashes, scripts, screenshots). Its four non-input
production files were reverted in the working tree to the accepted baseline. The
R2 documentation/evidence and the five R1 screenshots remain preserved as
untracked files. The confounded Antigravity `test_store_motion.mjs` (which installed
its own duplicate damping wrapper) was replaced by a policy-only integration suite;
`verify-phase2c-r1.mjs` (which asserts unaccepted R1 pause/mute/shop features) is
retained as preserved R1 material and is not an R3 gate.

## Verdict

The dedicated store-motion policy is the only seam, canonical motion executes
exactly once, damping is neutral-intent-only and source-agnostic, native keyboard
fallback and idempotent restore/rebind hold, the practical stop time is inside
100–200 ms, sustained wall rebound ends at exactly zero, and the canonical bundle
is unchanged. Remaining uncertainty is physical feel on a real device.
