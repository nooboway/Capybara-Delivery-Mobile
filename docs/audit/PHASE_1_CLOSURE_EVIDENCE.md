# Phase 1 final closure evidence

**PHASE 1 IS CLOSED.**

Acceptance baseline: `8bae9252a505455386dd6b3b59c913c663e92114`.

## QA correction retained

The verification runner consumes the real loading prompt with trusted touch, chooses Offline and Play, and waits for body.in-game before installing or pressing Okada controls. Direct game.start previously left the application's loading/menu promise pending; the cart press advanced that promise and menu initialization stopped store updates during the item test. No production input fix was required.

Layer E is part of scripts/verify-engine.mjs and adds four live canonical-store checks to the existing 36 assertions:

1. Trusted visible touch acquires the cart while the expected input object is consumed and the menu remains inactive.
2. Canonical item logic consumes Interact true, a resolved Milk Tea nearest item, cart possession, and zero cooldown; actual required Milk Tea and Apple are collected and allCollected becomes true.
3. Touch store completion returns to world, restores steer/GAS/BRAKE, hides walking, clears contributions, and rejects the old walking pointer's late movement.
4. Native keyboard E collects Milk Tea in an equivalent fresh store fixture with normalized interaction false.

The store fixture also respects held-Interact behavior: one press may satisfy several nearby requirements and can complete the store near its exit. It targets only unmet requirements, carries a neutral walking pointer across the completion, and accepts canonical completion during the held press. Only spatial setup and initial canonical store-entry fixtures are used. The test never assigns collected, cart, or allCollected and does not use manager.apply or synthetic keyboard events to obtain items.

Canonical world return is confirmed both from source and repeated runtime observations: the canonical module initializes world mode, _onOrderAccepted selects the world mission controller and records world as the return mode, and _onStoreComplete calls setMode with that recorded return mode. The null legacy driving controller is not forced by QA.

## External production build: verified source equivalence

The user ran pnpm run build from C:/Users/dev/Documents/Okada/artifacts/capybara-delivery in normal Windows PowerShell. pnpm printed the resolved C:/Users/dev/.gemini/antigravity-ide/scratch/Capybara-Delivery-Mobile/artifacts/capybara-delivery path.

Independent checks established:

- Documents/Okada is a Windows junction targeting that exact scratch repository, not a second checkout.
- At equivalence verification, both paths resolved to the same repository at the acceptance baseline above.
- All 257 audited tracked/untracked source, configuration, test, and documentation files match the Phase 1G SHA-256 manifest. No source file changed between that audit and acceptance of the supplied build.
- All 257 files also match between the junction and scratch paths, with zero differences.
- The generated artifacts match the supplied output: index-BxC119rk.css is 98,636 bytes and index-DPEMn9h0.js is 337,650 bytes.

The user-supplied normal-terminal build evidence is therefore accepted as source-equivalent external production-build evidence. It reports Vite 7.3.6, 1772 modules transformed, and successful completion in 8.86 seconds:

```text
> @workspace/capybara-delivery@0.0.0 build C:\Users\dev\.gemini\antigravity-ide\scratch\Capybara-Delivery-Mobile\artifacts\capybara-delivery
> vite build --config vite.config.ts
vite v7.3.6 building client environment for production...
src/components/ui/tooltip.tsx (2:0): Error when using sourcemap for reporting an error: Can't resolve original location of error.
âœ“ 1772 modules transformed.
dist/public/index.html                   2.35 kB â”‚ gzip:   0.97 kB
dist/public/assets/index-BxC119rk.css   98.64 kB â”‚ gzip:  16.37 kB
dist/public/assets/index-DPEMn9h0.js   337.65 kB â”‚ gzip: 108.77 kB
âœ“ built in 8.86s
```

The PowerShell prompt returned normally, as reported by the user. The sourcemap reporting warning was nonfatal. This document distinguishes that external build from the Codex-run build, which could not complete native realpath resolution.

**Previous Codex EPERM classification: ENVIRONMENTAL FILESYSTEM FAILURE.** Native Node realpath fails independently of Vite on the original repository, drive root, and temporary/clean locations inside Codex. The source-equivalent normal-terminal build succeeds. No production workaround, configuration change, or canonical-engine modification was introduced.

## Full-application TypeScript: preexisting repository debt

**Classification: PRE-EXISTING REPOSITORY DEBT.**

Phase 1G used TypeScript 5.9.3 and identical dependencies/compiler settings for read-only source/config snapshots at all requested checkpoints. Current compiler-API validation reproduces the full CLI's 201 diagnostics. All diagnostic records match exactly, including file, code, message, category, line, and column.

| Checkpoint | Diagnostics | Affected files | Added vs current | Removed vs current |
| --- | ---: | ---: | ---: | ---: |
| working-tree | 201 | 30 | 0 | 0 |
| 8bae9252 | 201 | 30 | 0 | 0 |
| 864bf330 | 201 | 30 | 0 | 0 |
| d85908d | 201 | 30 | 0 | 0 |

Each run contains TS2322 Ã—95, TS2339 Ã—100, TS2559 Ã—4, TS2724 Ã—1, and TS2741 Ã—1. The affected files are App.tsx and 29 preexisting UI component files. No normalized input-module diagnostic was introduced. This controlled comparison establishes no Phase 1 regression; it does not claim the unrelated debt has been repaired.

## Final Phase 1 acceptance

- Integrated verification: PASS — final repository rerun completed with 40 pass / 0 fail, process exit 0. The four Layer E checks passed as part of that same run; no post-hoc evidence counters were substituted.
- Input-only TypeScript validation: PASS, exit 0.
- Canonical touch cart, required item collection, allCollected, store completion, world return, restored vehicle controls, stale walking pointer prevention, and native E: covered by the integrated 40-check suite.
- Source-equivalent production build: PASS, external normal PowerShell evidence, 1772 modules transformed.
- Full-application TypeScript failures: preexisting repository debt, not Phase 1 regressions.
- Canonical engine SHA: C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.
- Gameplay/input production changes introduced by closure work: NONE.
- Local closure commit scope: verify-engine.mjs, new verify-store-interaction.mjs, and this document only. The preexisting untracked PHASE_1_ADVERSARIAL_QA.md is excluded from the closure commit.
- Remote push: NO. Phase 2 work: NONE.

Remaining non-Phase-1 debt: 201 full-application TypeScript diagnostics and the nonfatal sourcemap reporting warning. Neither is represented as repaired by this closure.


## Final closure decision

All Phase 1 acceptance conditions are satisfied. The previous full-application TypeScript failures are confirmed preexisting repository debt, and the previous Codex build EPERM is an environmental filesystem failure cleared as a regression by the verified source-equivalent external production build.

The final QA adjustment changed only tests: it avoids redundant pickups after required quantities are satisfied and handles completion during a held Interact press. Production source, build configuration, lockfile, and canonical engine still match the externally built state. Both source and dist/public copies of the canonical engine have the required SHA.

**PHASE 1 IS CLOSED.** This evidence is included in the authorized test/docs-only local closure commit. Its resulting full commit SHA is supplied in the final closure receipt. Nothing is pushed, and no Phase 2 work is included.
