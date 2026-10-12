# Phase 0B — Bundle Integrity, Provenance & Canonical Engine Baseline

> Every hash, parse result, and boot observation in this document was produced from **raw Git blobs** and **independent parsers**, not from pretty-printed or transformed output. Offsets are byte offsets in the canonical artifact.

---

## 1. Executive finding

The committed `main-CSpZwCDB.js` **genuinely contains a syntax error** at line 2327 (byte ~6,572,370), confirmed by **three independent parsers** (Chrome/V8, Acorn 8.18, esbuild 0.18) and by a raw byte hexdump of the Git blob (the `"` in `xmlns="http://…"` is unescaped inside a `"…"` string literal).

The error was **introduced by commit `d85908d`** during the Capybara→Okada rebrand: it replaced a valid image path with an SVG data URL whose inner quotes were not escaped.

A **valid, known-good ancestor exists**: the parent commit `f7bfda2` (which is byte-identical to the local `capybara_shipped_app` copy) parses and boots. **This is the canonical engine baseline.**

The input-exposure patch from Phase 0A is **feasible, minimal, and structurally-anchored**: only `rC` (the single input abstraction object) needs to be exposed; every anchor tested matches **exactly once** in the canonical bundle.

**Canonical baseline: BASELINE B (f7bfda2).** **Architecture verdict: B1 — proceed with a controlled, deterministic, fail-closed patch.**

---

## 2. Current artifact identity

| Field | Value |
| :--- | :--- |
| Branch | `main` |
| HEAD | `d85908d4b8f9f61ebe3d55cfa74a108e79bd78cf` |
| Working tree | clean except untracked `docs/` |
| Remote | `https://github.com/nooboway/Capybara-Delivery-Mobile` |
| Bundle path | `artifacts/capybara-delivery/public/assets/main-CSpZwCDB.js` |
| Working-tree size (CRLF) | 6,592,057 bytes |
| Working-tree SHA-256 | `C758E0003161BB6D7C25B81C6FE1C53267B405812F33E2E2CD1DB63D6C53CC31` |
| Committed blob (LF) SHA-256 | `D7F7A32A92ECF63B3F87DBF9D5002486F7BCAA9774C6DA1DEC9A58554603C1FB` |
| Committed blob object | `7a0f88f621e9254db0f2ed8b9743c1011b3fe152` |

> The working tree is 2,459 bytes larger than the git blob because `core.autocrlf` stores LF in the index and checks out CRLF. Both variants contain the same broken expression.

---

## 3. Raw syntax investigation

Extracted from the **raw git blob** (`git cat-file blob 7a0f88f6…`), byte region around the suspect expression:

```
HEX (…6572370):
  4a 41 2e 73 72 63 3d 22 | 64 61 74 61 3a 69 6d 61 67 65 2f 73 76 67 2b 78 6d 6c 2c 3c 73 76 67 20
  78 6d 6c 6e 73 3d 22    | 68 74 74 70 3a 2f 2f 77 77 77 2e 77 33 2e 6f 72 67 2f 32 30 30 30 2f 73 76 67 22 2f 3e 22
ASCII:
  JA.src="data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>"
```

The byte `3d 22` (`= "`) immediately after `xmlns` is an **unescaped ASCII quote (0x22)** inside the double-quoted JS string `"data:image/svg+xml,<svg …"`. The string therefore terminates at `xmlns=`, and the following `http` becomes a bare identifier.

**Conclusion: the quotation marks are genuinely malformed at the byte level.** This is **not** a display/extraction/DevTools artifact.

The parent `f7bfda2` blob (`d29a1bc3…`) contains the well-formed original at the same location:

```js
JA.src="/images/award_white_on_transparent_vibejam_winner.png",JA.alt="Vibe Jam Winner",…
```

---

## 4. Independent parse results

| Artifact | V8 (Chrome) | Acorn 8.18 | esbuild 0.18 | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| committed `d85908d` | FAIL `Unexpected identifier 'http'` 2327:87 | FAIL `Unexpected token` 2327:86 | FAIL `Expected ";" but found "http"` 2327:86 | **PARSE FAILURE** |
| parent `f7bfda2` | (boots — see §5) | **PASS** | **PASS** | valid |
| `shipped_app` (local) | boots (Phase 0A) | **PASS** | **PASS** | valid |
| working-tree (CRLF) | FAIL | FAIL 2327:86 | FAIL | **PARSE FAILURE** |
| live reference `main-CSpZwCDB.js` | — | FAIL `Unterminated string constant` 424 | FAIL `Unterminated string literal` 424 | see §9 |

This is a **PARSE FAILURE**, not a runtime failure and not an asset/network failure: the module never evaluates, so no `__capyGame`/renderer/Three.js/Rapier is ever created.

---

## 5. Browser boot results (committed bundle)

A clean headless-Chrome load of the exact committed artifact (`public/` served verbatim, no overrides):

```json
{
  "hasCapyGame": false,
  "hasCapyAudio": false,
  "hasThree": false,
  "canvasCount": 0,
  "title": "Okada - A Game About Animals Delivering Food"
}
```

Events: single `[pageerror] SyntaxError: Unexpected identifier 'http'`. No renderer, no Three.js, no Rapier, no globals. **The committed game does not boot.** (This is a module-level parse failure — the `window.__capyGame = this` assignment is never reached.)

---

## 6. Git provenance

Bundle was touched by exactly two commits:

```
f7bfda2  Implement game server routes and update dependencies      (added the bundle)
d85908d  feat(mobile): rebrand to Okada, … inject mobile touch controls  (modified it)
```

- `f7bfda2` blob `d29a1bc3…` — contains the valid `award_white_on_transparent_vibejam_winner.png` line; **parses**.
- `d85908d` blob `7a0f88f6…` — replaced that line with the broken SVG data URL; **fails to parse**.

`git diff f7bfda2 d85908d -- <bundle>` = **8 insertions, 8 deletions** (16 lines). The suspect expression is unambiguously one of the `+` lines.

---

## 7. Commit-by-commit relevant history

| Commit | Change to bundle | Parse | Author |
| :--- | :--- | :--- | :--- |
| `f7bfda2` | Adds full game bundle (Three.js + Rapier + game, `window.__capyGame`, vibejam branding) | PASS | Replit Agent |
| `39259bf` | none (no bundle stat) | — | Replit Agent |
| `15d43c8` | none (server/memory only) | — | Replit Agent |
| `d85908d` | 8 region edits (rebrand + portal + perf), one of which corrupts the bundle | **FAIL** | nooboway (Antigravity session) |

---

## 8. Bundle candidate inventory

| Candidate | Provenance | SHA-256 | Size | Parses | Boots | Relevant modifications | Canonical? |
| :--- | :--- | :--- | ---: | :--- | :--- | :--- | :--- |
| `d85908d` committed | git blob `7a0f88f6` | `D7F7A32A92ECF63B3F87DBF9D5002486F7BCAA9774C6DA1DEC9A58554603C1FB` | 6,589,597 | **No** | **No** | rebrand + portal + perf + **corruption** | No |
| `f7bfda2` parent | git blob `d29a1bc3` | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` | 6,588,195 | **Yes** | **Yes** | (pristine game import) | **YES** |
| `shipped_app` (local) | `scratch/capybara_shipped_app` | `C7E6C0AE…` (identical to f7bfda2) | 6,588,195 | **Yes** | **Yes** | byte-identical to f7bfda2 | (same as f7bfda2) |
| working-tree (CRLF) | checkout of d85908d | `C758E0003161BB6D7C25B81C6FE1C53267B405812F33E2E2CD1DB63D6C53CC31` | 6,592,057 | **No** | **No** | LF→CRLF variant of d85908d | No |
| live reference | `capybara-vibejam26.leocoout.dev` | `3BF81F427B84771D1C2AE2494A95B8BC8594FC9E9278691CAC3E3CA0EF944F40` | 1,095,557 | ambiguous (see §9) | not evaluated (different build) | different build, no `__capyGame` | No |

---

## 9. Reference bundle comparison

The live reference serves `/assets/main-CSpZwCDB.js` (1,095,557 bytes) — **six times smaller** than the repo bundle, and its `index.html` still includes `https://vibejam.cc/2026/widget.js` (removed in the repo).

Content markers (live reference): `__THREE__` present, `rapier` present, but **`__capyGame` absent**, no `award_white_on_transparent_vibejam_winner.png`, no "Capybaras Delivering Food"/"Okada"/"sylens 2026" strings, and a trailing WebAssembly blob. Acorn/esbuild report "Unterminated string constant" — consistent with this older build's WASM/string embedding (and/or a genuinely different, pre-`__capyGame` build).

**Relationship classification: SUBSTANTIALLY DIFFERENT.** It is not `REFERENCE + REBRAND` and not `REFERENCE + MOBILE`. It is a distinct build (different code-splitting/minification and an earlier game structure without the `window.__capyGame` global that Okada's mobile work depends on). It is therefore **not a suitable canonical for Okada**; it is a useful provenance reference only.

---

## 10. Okada bundle modifications (d85908d, 8 regions)

| # | Region | Before (f7bfda2) | After (d85908d) | Category | Intentional? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `JA.src`/`JA.alt` (intro badge) | `…/award_white_on_transparent_vibejam_winner.png`, "Vibe Jam Winner" | `data:image/svg+xml,<svg xmlns="http://…"/>`, "sylens 2026" | BRANDING | **CORRUPTED** (unescaped quotes) |
| 2 | `BA.alt` (menu logo) | "Capybaras Delivering Food" | "Okada - A Game About Animals Delivering Food" | BRANDING | yes |
| 3 | `FA.alt` (intro brand) | "Capybaras Delivering Food" | "Okada - A Game About Animals Delivering Food" | BRANDING | yes |
| 4 | stats link | `window.open("https://capybara-vibejam26…/stats")` | `window.open("/")` | PORTAL | yes |
| 5 | portal link | `https://vibejam.cc/portal/2026?…` | `/?…` | PORTAL | yes |
| 6 | `_playFadeTransition` | 420/60/380 ms | 120/20/120 ms | PERFORMANCE | yes |
| 7 | fade warmup cap | `_warmupFramesLeft=g` | `_warmupFramesLeft=Math.min(g,2)` | PERFORMANCE | yes |
| 8 | renderer DPR | `setPixelRatio(f.pixelRatio)` | `setPixelRatio(Math.min(devicePixelRatio,1.5)*(f.pixelRatio||1))` | PERFORMANCE | yes |

No INPUT, GAMEPLAY, PHYSICS, MISSION, or SCORING changes were made. Only **one** of the eight edits is corrupted; the other seven are safe Okada customizations that can be cleanly re-applied on top of the canonical baseline.

---

## 11. Canonical baseline decision

**BASELINE B — earlier repository bundle `f7bfda2`.**

Rationale: it is the closest legitimate ancestor, it parses (acorn + esbuild PASS), it boots (Phase 0A confirmed `window.__capyGame`/`__capyAudio`/`__THREE__` appear), and it contains the complete input architecture (`rC`, `bC`, `Di`, `Hg`) that the mobile work depends on. The live reference is rejected (different build without `__capyGame`); the current HEAD is rejected (corrupt); the working tree is the same corrupt content with CRLF.

---

## 12. Canonical artifact contract

```text
canonical filename   : artifacts/capybara-delivery/public/assets/main-CSpZwCDB.js
canonical git object : d29a1bc39522b5461606b864e2f0d73734b00d3c  (blob @ f7bfda2)
canonical byte size  : 6,588,195 bytes (LF)
canonical SHA-256    : C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E
source/provenance    : git history commit f7bfda2; byte-identical to local capybara_shipped_app
known modifications  : none (pristine); the 7 safe d85908d edits are documented in §10 and must be re-applied separately
expected parse result: PASS (acorn + esbuild + V8)
expected boot result : window.__capyGame / __capyAudio / __THREE__ present; canvas renders
```

Any future process must be able to assert "I am patching exactly this artifact" by verifying the SHA-256 (and/or the git blob) before touching it.

---

## 13. Required input exposure (minimum)

Phase 0A named four internal objects (`rC`, `bC`, `Di`, `Hg`). The **minimum exposure is `rC` alone**, because:

- `rC` is the single input abstraction the game loop and controllers actually consume (`this.driving.update(rC, …)`, `rC.interact`, `rC.brake`, `rC.backward`, `rC.consumeMouseDelta()`).
- Every conceptual field maps to an `rC` getter: `steer`→`steerDir`, `throttle`→`forward`, `reverse`→`backward`, `brake`→`brake`, `drift`→`shift`, `wheelie`→`wheelie`, `interact`→`interact`, `walkX/walkY`→`walkVec`.
- An adapter can override `rC`'s getters at runtime (`Object.defineProperty(window.__capyInput, 'steerDir', { get: … })`), which is sufficient for **analog steering**, a **dedicated brake**, and **analog walking** — without touching `bC`/`Di`/`Hg`.

`bC`/`Di`/`Hg` do **not** need exposure. (Only if a consumer were found to read `Di`/`bC`/`Hg` directly — bypassing `rC` — would they additionally need exposure; the evidence shows consumers use `rC`.)

---

## 14. Structural anchor analysis

Match counts for candidate anchors in the **canonical** bundle:

| Anchor (structural, not minified-name keyed) | Match count | Verdict |
| :--- | :--- | :--- |
| `const rC={get forward(){return!Ft&&(Hg.has("KeyW")` | **1** | unique |
| `get steerDir(){if(Ft)return 0` | **1** | unique |
| `get walkVec(){if(Di.active)return{x:Di.x,z:Di.z,active:!0}` | **1** | unique |
| `get brake(){return!Ft&&Hg.has("Space")}` | **1** | unique |
| `consumeMouseDelta(){const e=Ns,A=Fs;return Ns=0,Fs=0,{dx:e,dy:A}}` | **1** | unique |
| `const bC={left:!1,right:!1,forward:!1,backward:!1,speed:!1,interact:!1}` | **1** | unique |
| `function V8(e){Ft=!!e}` | **1** | unique |
| `function Ll(){TB("btn-touch-left"` | **1** | unique |

**The exposure insertion point is uniquely identifiable** — immediately after the `rC` object literal's final method `consumeMouseDelta(){…}` (i.e., the `consumeMouseDelta(){const e=Ns,A=Fs;return Ns=0,Fs=0,{dx:e,dy:A}}` anchor). Every anchor is a distinctive code pattern, not a byte offset and not a minified symbol name, so it survives re-minification of the same source (though not an upstream source change, which would require re-verification).

---

## 15. Patch idempotency design

The future patcher must distinguish three states:

| State | Detection | Behavior |
| :--- | :--- | :--- |
| UNPATCHED CANONICAL | SHA-256 == `C7E6C0AE…` AND no `window.__capyInput` marker | apply shim |
| ALREADY PATCHED | bundle contains the `window.__capyInput=rC` marker (and a version flag) | no-op (or verify, never double-inject) |
| UNKNOWN/UNSUPPORTED | SHA-256 differs AND marker absent | **hard fail** (no silent assumption) |

The shim must be idempotent: `window.__capyInput === rC` assignment plus a single marker (`window.__capyInputApi = 1`) whose presence makes re-application a no-op.

---

## 16. Fail-closed behavior

The patcher must implement, in order, and **abort on any failure** (no "anchor missing — continuing anyway"):

```text
1. Verify canonical source SHA-256 (and/or git blob id).
2. Locate the consumeMouseDelta() structural anchor.
3. Assert expected match count == 1.
4. Insert `window.__capyInput=rC;window.__capyInputApi=1;` after the rC literal.
5. Assert the output changed exactly once.
6. Parse the output (acorn + esbuild + a headless V8 module load).
7. Boot the output (assert __capyGame/__capyAudio/__THREE__ + canvas).
8. Assert __capyInput exists and steerDir/walkVec getters are overridable.
9. Run the input contract smoke test (§18).
10. Emit the patched artifact + a manifest {sourceHash, patchVersion, outputHash}.
```

Any step failing ⇒ **BUILD FAILURE** with a loud error. (Not implemented this phase.)

---

## 17. Future public input contract

Mapped to the engine's real semantics (not an invented abstraction). Note the engine distinguishes **five** longitudinal channels:

```ts
interface OkadaEngineInput {
  steer: number;     // -1..1   → rC.steerDir   (engine currently collapses to -1/0/+1; adapter supplies continuous)
  throttle: number;  // 0..1    → rC.forward
  reverse: number;   // 0..1    → rC.backward    (distinct from brake)
  brake: number;     // 0..1    → rC.brake       (dedicated decel channel; physics: rapierBrakeDecel:28)
  drift: boolean;    //         → rC.shift       (drift + boost tiers)
  wheelie: boolean;  //         → rC.wheelie
  interact: boolean; //         → rC.interact
  phone: boolean;    //         → (game-owned phone UI; not a physics input)
  walkX: number;     // -1..1   → rC.walkVec.x   (native analog Di.x)
  walkY: number;     // -1..1   → rC.walkVec.z   (native analog Di.z)
}
```

The adapter **normalizes toward the engine's real semantics**: it preserves the brake-vs-reverse distinction, keeps `drift` (shift) separate from `brake`, and treats `walkVec` as a true 2D analog vector (already natively analog via `Di`).

---

## 18. Required smoke tests (before Phase 1)

1. **Parse** — patched bundle parses (acorn + esbuild + V8 module load).
2. **Boot** — `window.__capyGame`, `__capyAudio`, `__THREE__` present; canvas created.
3. **Globals** — `window.__capyInput` exists and `__capyInputApi === 1`.
4. **Input API** — `steerDir`, `walkVec`, `brake`, `forward` getters exist and are overridable.
5. **Steering** — controlled input yields `-1`, `0`, `+1`, and a fractional value (e.g. `0.35`) at the `steerDir` boundary.
6. **Throttle** — `forward` can be activated and released.
7. **Brake** — dedicated `brake` channel activates independently of `backward`.
8. **Reverse** — `backward` is distinguishable from `brake`.
9. **Walking** — continuous 2D vector observed (e.g. `walkVec = {x:0.42, z:-0.71}`), not merely WASD states.
10. **Interaction** — `interact` activates and releases.
11. **Release safety** — all inputs return to neutral after pointer/input release.

---

## 19. Patch risk rating

**MEDIUM.**

- Closed-source/minified artifact: yes (single maintainer, no upstream source in repo).
- Update frequency: low (the game is a fixed jam build; the only change since import was `d85908d`).
- Structural-anchor uniqueness: high (all anchors match exactly once).
- Hash pinning: available (SHA-256 + git blob id).
- Automated verification: available (3 parsers + headless boot + smoke tests).
- Silent-corruption possibility: low **if** fail-closed; high if hand-edited (as `d85908d` demonstrated).
- Exposed state: minimal (one object, `rC`).
- Dependency on generated identifiers: none (anchors are code-pattern based).

The risk is dominated by the "closed artifact, no source" reality and by the fact that the only prior modification attempt already corrupted the file. A deterministic, hash-pinned, fail-closed post-build step reduces this to an acceptable MEDIUM.

---

## 20. Option B vs Option C reassessment

**Option B (existing engine + deterministic exposure patch + Okada adapter) remains preferable.**

- The engine is **proven valid** (`f7bfda2` parses + boots) and is **complete** (Three.js + Rapier + full game: driving, store, missions, scoring, input).
- The required change is **minimal and stable**: expose one object via one structurally-anchored, hash-pinned, fail-closed insertion; the rest is runtime.
- **Option C (reconstruction)** would re-implement, from a minified artifact, a large working game (vehicle physics, drift/boost, cargo, missions, scoring, store, phone UI, multiplayer) at far higher engineering risk and time, for zero gameplay benefit.

Reconstruction is only warranted if the exposure patch later proves unmaintainable across upstream updates — which is not the case given the artifact is effectively frozen (jam build).

---

## 21. Remaining unknowns

1. **Exact bytes of the `rC` literal's closing delimiter** (`}}` vs `}}` followed by `,g2=new Map`) — confirmed present and unique via the `consumeMouseDelta` anchor; the precise insertion delimiter will be finalized in Phase 1.
2. **Whether any consumer reads `Di`/`bC`/`Hg` directly** rather than through `rC` — Phase 0A traced all driving/menu consumption through `rC`; the store walker path through `rC.walkVec` is supported but not re-verified at runtime (boot could not reach store mode on the corrupt bundle). If a direct `Di` reader exists, exposure would expand from `rC` to `rC + Di` (minor).
3. **Live reference parse status** — its acorn/esbuild "unterminated string" is not fully explained (likely the older build's WASM/string embedding); immaterial to the canonical decision since it is a different build without `__capyGame`.

---

## 22. Recommendation

1. **Adopt `f7bfda2` as the canonical engine baseline** (SHA-256 `C7E6C0AE…`, git blob `d29a1bc3…`).
2. **Re-apply the 7 safe `d85908d` customizations** (branding alts, portal links, fade timing, DPR clamp) and **replace the corrupted SVG data URL** with a correctly-escaped form (or the original image path) — as a separate, reviewed step, not bundled into the input patch.
3. **Implement the input exposure as a deterministic, hash-pinned, fail-closed post-build step** exposing `rC` only, guarded by the §18 smoke tests.
4. **Proceed to Phase 1 (input adapter) only after approval** of this baseline and the corrected rebrand.

---

## Required provenance conclusion

```
The syntax corruption was introduced by:
  commit d85908d  ("feat(mobile): rebrand to Okada, add local asset packs, and inject mobile touch controls")
```

Evidence: `git diff f7bfda2 d85908d -- <bundle>` shows the `JA.src` line changed from the valid `…/award_white_on_transparent_vibejam_winner.png` to the malformed `data:image/svg+xml,<svg xmlns="http://…"/>`; the parent parses (acorn+esbuild PASS) and the child fails (3 parsers FAIL); the raw blob hexdump confirms the unescaped `0x22` bytes.

## Required canonical baseline verdict

**BASELINE B — earlier repository bundle `f7bfda2`** (blob `d29a1bc39522b5461606b864e2f0d73734b00d3c`, SHA-256 `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E`).

## Required architecture verdict

**ARCHITECTURE B1 — PROCEED WITH CONTROLLED PATCH.** A canonical engine artifact exists and the input exposure can be implemented as a deterministic, versioned, fail-closed compatibility patch. Phase 1 begins only after explicit approval.
