# RYDER Phase 2C-R3 implementation and verification

Status: automated R3 gates PASS. READY FOR PHYSICAL STORE RETEST. Physical feel is not verified.

1. Verdict: automated R3 acceptance PASS; READY FOR PHYSICAL STORE RETEST.
2. Starting HEAD: original R3 c7df3fb581b65ab332df8931619182bcd990e5fa; this continuation resumed at 420fcef063535f1ecb6e14dbf7e6b5ca8c4e9e89.
3. Final SHA: the local follow-up commit containing this report (reported to the user after creation). Original policy implementation: e805a9669fb579b683f4f9fee257036c4ab51d37.
4. Remote pushed: NO by this continuation.
5. Canonical SHA: C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.
6. Canonical unchanged: YES.
7. Production files modified: original R3 added src/lib/ryder-store-motion-policy.ts and integrated src/lib/input/index.ts; this continuation changes only touch-source orientation release and duplicate-native-joystick suppression. Unrelated existing touch UX changes are excluded from the follow-up commit.
8. Option D authorized implementation used: YES; explicit isolated policy module.
9. Original store.update preserved: YES; exact function and original own descriptor/inherited-method status retained.
10. Wrapper idempotent: YES; one WeakMap installation per store, refcounted leases.
11. Wrapper disposal: exact original restored by final lease; repeated disposal harmless.
12. Reload rebinding: actual iframe reload restores old method and installs on a different store.
13. Wrapper stacking prevented: repeated installation reuses a wrapper; generation re-init disposes before rebinding; exactly-once execution verified.
14. Effective walking-intent source: input.walkVec supplied to canonical store.update, including native keyboard fallback.
15. Touch-specific physics coupling: NO.
16. Keyboard-specific physics coupling: NO.
17. Damping equation: horizontal v *= exp(-28 * dt), after one canonical update, only for neutral intent and finite positive dt in an active store.
18. Candidate constants tested: 20, 28, 36 s^-1, each at full/low/diagonal speed.
19. Selected constant: 28 s^-1; gentlest tested value meeting target.
20. Snap-to-zero threshold: horizontal magnitude <= 0.05; intent epsilon 1e-6. Active input is not damped.
21. Full-speed starting velocity: magnitude 3.
22. Velocity at 50 ms: 0.73979089 (60/120 Hz).
23. Velocity at 100 ms: 0.18243019.
24. Velocity at 150 ms: exactly 0.
25. Velocity at 200 ms: exactly 0.
26. Measured practical stop time: 150 ms at 60/120 Hz; all measured rates inside 100–200 ms.
27. Measured stopping distance: 0.13206967 units at 60 Hz; 0.11832713 at 120 Hz.
28. Low-speed stop time: 66.67 ms from 0.3.
29. Diagonal stop: 150 ms from magnitude 3; direction retained until rest.
30. 30 FPS result: 166.67 ms, 0.16326020 units.
31. 60 FPS result: 150 ms, 0.13206967 units.
32. High-refresh result: 90 Hz 155.56 ms; 120 Hz 150 ms. Coarse native position integration changes distance, not the time-based damping rule.
33. Wall collision result: native rebound speed 2 persists; policy reaches zero after eight 60 Hz steps.
34. Sustained rebound eliminated: YES in controlled boundary test; no resurrection through 90 frames.
35. Active walking speed preserved: exact native equality for axial and continuous diagonal intent, including magnitude-3 top speed.
36. Direction reversal: PASS; opposite intent changes direction without a passive-stop wait.
37. Diagonal vectors preserved: PASS, including (0.42,0.71).
38. Store idle: zero displacement and velocity from idle entry.
39. Pointerup neutral: PASS.
40. Pointercancel neutral: PASS.
41. lostpointercapture neutral: PASS.
42. Blur neutral: PASS.
43. Visibility neutral: PASS.
44. Orientation neutral: PASS for explicit orientation-event fault injection. Real-device orientation UX remains outside this acceptance.
45. Store entry: neutral; native entry resets velocity.
46. Store exit: neutral; old walking ownership revoked.
47. World→store→world lifecycle: PASS; return to store retains one policy and neutral entry.
48. Iframe reload lifecycle: old canonical method restored; different new store wrapped once; trusted touch checked after reload.
49. Native W: PASS with touch idle and after touch release.
50. Native A: PASS.
51. Native S: PASS.
52. Native D: PASS.
53. Native E: PASS; actual canonical cart acquisition and Phase 1 item collection.
54. Touch idle does not suppress keyboard: PASS; registration is not treated as activity.
55. Touch active walking: PASS; real trusted pointer events produce continuous diagonal input.
56. Touch release: neutral input and exact rest; stale moves rejected.
57. Synthetic keyboard absent: no touch-to-keyboard bridge introduced; browser keyboard automation is test input only.
58. Keyboard regression resolved: YES; native fallback restored in R3 and verified independently.
59. EngineAdapter modified: NO by this continuation or accepted R3 implementation.
60. InputManager modified: NO.
61. TouchInputSource modified: YES, two input-safety corrections only; no physics logic added.
62. Canonical bundle modified: NO.
63. Pause hack status: absent; clock.getDelta is not wrapped by the R3 policy or adapter.
64. Safe pause seam found: NO complete game/timer/audio/callback pause seam; discovery only.
65. Focused policy tests: unit 23/23 PASS; final-source expanded motion suite 49/49 PASS; real iframe/reload/trusted-touch suite 5/5 PASS.
66. Existing regression tests: final-source Phase 1 40/40. Exact R3 checkpoint Phase 2B 37/37 and Phase 2C 59/59. Current newer UX tree's historical suites stop after 21/28 passing checks at obsolete separate-Reverse selectors; those current-tree runs are NOT reported as passing.
67. Input typecheck: PASS, exit 0; strict standalone validation of input entry and policy, not a claim that unrelated full-app TypeScript debt was fixed.
68. Production build: PASS, exit 0; 1775 modules, 44.94 seconds; pre-existing tooltip sourcemap warning remains nonfatal.
69. Documentation paths: docs/architecture/RYDER_STORE_MOTION_POLICY.md; this report; docs/ux/evidence/r3-final-*.log and r3-checkpoint-phase2*.log.
70. Remaining P0: none found in tested R3 scope.
71. Remaining P1: no automated R3 blocker found. Physical store feel remains unverified; broader UX is not accepted by R3. Historical current-tree test selectors need alignment with the later control redesign.
72. Physical store feel verified: NO.
73. Recommendation: READY FOR PHYSICAL STORE RETEST. STOP; no automatic continuation of R1/Phase 3.

## Scope, preservation and review

The original R3 implementation commit already existed when this continuation resumed. Later mobile UX commits and uncommitted control/screenshot work were preserved. A byte-copy backup is at C:/Users/dev/Documents/Codex/2026-10-11/files-pasted-by-the-user-i/r3-resume-preserved; original R1/R2/R3 backups remain intact. Additional test-script and generated-screenshot backups are beside it. Only the two reviewed touch-source safety changes are selected for the follow-up commit; other existing working changes are not accepted or staged.

The actual reload test exposed the canonical native joystick appearing after controls-ready at z-index 250 over Ryder's root at 100. A trusted event trace had an upper native hit target and zero normalized intent. Suppressing that duplicate alongside the already-suppressed native driving UI fixes touch ownership while attached; disposal restores canonical UI. It does not change native keyboard state or motion physics. Orientationchange now resets ownership even if orientation signals appear unchanged.

The prior report docs/ux/PHASE_2C_R3_STORE_MOTION.md records initial implementation evidence. This report supplements it with measured candidates, rates, actual reload/trusted touch, final-source tests and scoped compatibility classification; it does not retroactively claim physical acceptance.

## Replay method and limitations

The current tree is later than the R3 checkpoint. Historical 2B/2C scripts on that current tree abort on the removed separate Reverse control; this was introduced by the later immersive control redesign, not the store policy. To distinguish those changes, the original R3 input source, policy and HTML were exported from e805a9669fb579b683f4f9fee257036c4ab51d37 into an isolated local fixture. The test launchers there use installed pinned dependencies and unchanged static assets through a read-only fallback; production source/HTML are the archived checkpoint. Canonical SHA matched, and Git showed no asset/pack differences between R3 and current HEAD. Windows denied junction creation, so no junction-based setup was used. Both historical suites then completed without functional failures. These are checkpoint-scoped passes, not current immersive-UX acceptance.

Normal startup, Offline Play and Play are used before runtime checks. Store entry/position and fixed-dt measurements use explicit canonical QA fixtures, not a claim of physically driving an entire mission. For free-space velocity measurements shelf colliders are cleared only inside the fixture, then restored; boundary tests use native bounds/collision. No production position clamps, counter-input, or engine configuration workaround is installed.

Initial test issues are retained in the audit trail: a 10-second store wait timed out; an iframe load-before-startup-click ordering deadlocked the test and was corrected; a keyboard movement check initially hit a collision and was isolated from collision for source-parity measurement; a viewport-only orientation test was replaced with an explicit orientation event. Subsequent trusted tracing identified the actual competing joystick. The final tests do not bypass the native startup, directly start the game, or fake a production pause.

Local screenshot generation succeeded, but attempts by historical scripts to copy into the Antigravity brain directory reported EPERM. This does not affect functional assertions or the production build. Generated screenshots in the live repository were backed up before being restored so pre-existing screenshot work stayed separate.

No push, deployment, Phase 3 work, visual polish, new pause architecture, or physical-device ergonomic acceptance is part of this continuation.
