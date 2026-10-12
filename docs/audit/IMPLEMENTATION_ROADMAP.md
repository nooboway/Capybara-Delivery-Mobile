# Implementation Roadmap — Okada Mobile-First Reconstruction

> Gated phases. Each gate has explicit acceptance criteria. **No implementation has begun** — this is the plan awaiting approval.

## Guiding constraints

- Preserve the game engine + asset packs + rebrand assets (the user's game).
- Remove the redundant synthetic-keyboard bridge and competing UI.
- Mobile is primary; desktop/keyboard secondary; gamepad + tilt are later additions.
- No full rewrite (Option C) unless Phase 4 approves it.

---

## Phase 0 — Instrumentation & surface enumeration

**Goal:** establish how to drive the engine's input without keyboard synthesis.

- [ ] Enumerate `window.__capyGame` (and `__capyAudio`, `__THREE__`) properties/methods via a throwaway inspection script in a browser console (dev-only).
- [ ] Determine whether `bC` (touch state), `Di` (walk vector), `Hg` (key set), and `steerDir` are reachable/readable/writable.
- [ ] Record the exact bundle hash for `main-CSpZwCDB.js` as a patch baseline.

**Acceptance:** a one-page table of the exposed input surface + a written decision: *public-API bind* vs *scoped patch*.

---

## Phase 1 — Input unification (core)

**Goal:** one normalized input state feeding the game.

- [ ] Delete `touch-controls.ts` synthetic-keyboard bridge.
- [ ] Implement analog steering (dynamic thumbstick / horizontal slider) writing continuous `steerDir ∈ [-1,1]`.
- [ ] Implement accelerator (hold), **dedicated brake** (maps to `brake`/`Space`, distinct from reverse), reverse, drift trigger, and contextual interact.
- [ ] Rewire store movement to feed `Di.x/Di.z` as a 360° analog vector (remove 8-direction quantization).
- [ ] Add `setPointerCapture` + movement-relative tracking on all controls (no `pointerleave` release).
- [ ] Keep keyboard (`Hg`) and future gamepad paths writing the same state.

**Acceptance:** (a) smooth proportional steering with no full-lock snapping; (b) braking stops the bike without reverse-torque lurch; (c) store walking is continuous 360°; (d) thumb slide-off does not cut input; (e) keyboard still works identically on desktop.

---

## Phase 2 — UI ownership unification & UX

**Goal:** the game is the single UI authority.

- [ ] Remove the React host toolbar/modal; fold "fullscreen / settings / play-on-mobile" into the game's UI (top-left drawer or in-game settings).
- [ ] De-conflict top-right controls; re-dock `#phone-hud` for landscape + `env(safe-area-inset-*)`.
- [ ] Apply `touch-action: none` + `user-select: none`; enforce landscape; touch targets ≥ 44 pt.
- [ ] iOS fullscreen/audio handled at game context (first-gesture `__capyAudio.ctx.resume()`).
- [ ] Minimal onboarding overlay (steer/gas/brake/drift/interact) once.

**Acceptance:** (a) no overlapping tappable regions at 375–430 px landscape; (b) no double-tap zoom/gesture interference; (c) audio unlocks from first in-game tap on iOS; (d) fullscreen works or degrades gracefully.

---

## Phase 3 — Performance & asset delivery

**Goal:** hit startup + runtime budgets.

- [ ] Replace eager-everything preload with per-scene streaming + Cache API/service-worker pre-warm.
- [ ] Quality-tier ladder (low/medium/high) gating DPR (≤1.5), shadows, post-processing, particles.
- [ ] Move 90 MB `/p/*.bin` out of git to a CDN/object store (or LFS); keep hashed manifest for cache-busting.
- [ ] Remove dead weight: mockup-sandbox, `lib/` scaffolding, ~30 unused shell deps.

**Acceptance:** (a) first-visit interactive ≤ 3 s on mid-tier over 4G (menu pack only); (b) quality tiers verified on 2 devices; (c) repo no longer carries 90 MB binaries.

---

## Phase 4 — Gate review

**Decision point:** ship Option B result, or escalate to Option C (independent rebuild).

**Acceptance:** a short review document summarizing measured outcomes and a go/no-go for a clean-room rebuild.

---

## Later (post-approval, optional)

- Gamepad support via `navigator.getGamepads()` mapped into the normalized state.
- Tilt steering as a settings toggle.
- Multiplayer leaderboard hardening (WebSocket `sendScore` path).

---

## Stop condition

This plan is delivered for approval. No production code, bundles, assets, or package versions have been modified. The only changes made this session are (1) REA registration for OpenCode (with backup) and (2) this `docs/audit/` documentation set.
