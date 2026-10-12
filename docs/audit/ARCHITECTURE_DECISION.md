# Architectural Decision — Mobile-First Reconstruction

> Three approaches compared against evidence. Recommendation: **Option B**.

## Context (verified)

- The game is a **closed, minified bundle** (`main-CSpZwCDB.js`, 6.29 MB) + a 3835-line HTML/DOM shell. The readable source is **not in the repo**. The user owns the game (`.agents/memory/capybara-game.md`) and is authorized to reproduce it.
- The engine already has: native touch input (`bC`, `Di`, `#btn-touch-*`), analog-capable physics (`steerDir`, `walkVec`), and exposed globals (`window.__capyGame`, `__capyAudio`, `__THREE__`).
- The current mobile adaptation adds a **redundant synthetic-keyboard bridge** and a React shell with a competing toolbar.

## Option A — Preserve the wrapper, improve integration

Keep the React shell + iframe + `touch-controls.ts`; patch bugs (pointer capture, add brake, deconflict toolbar).

| Dimension | Assessment |
| :--- | :--- |
| Engineering complexity | Low |
| Mobile usability | Low (still binary steering, still dual-shell, still cross-iframe input) |
| Performance | Same (no change to bundle/UI ownership) |
| Maintainability | Poor (two UI owners, event bridging) |
| Provenance/legal | Low risk (no engine change) |
| Risk | Low |
| Time to playable | Fastest |
| Extensibility | Poor |

**Verdict:** only a stop-gap; does not reach "professional mobile arcade" bar.

## Option B — Replace input/UI integration, retain reusable game infrastructure (RECOMMENDED)

Retire the React shell's input bridge and toolbar; make the game the **single UI owner**. Unify input through the engine's native `bC`/`Di` (or a scoped, versioned patch to its input getters) with an analog steering stick, a real brake, an analog store joystick, and pointer capture. Keep the engine, asset packs, and rebrand assets. Drop `touch-controls.ts`, the mockup-sandbox, and unused scaffolding.

| Dimension | Assessment |
| :--- | :--- |
| Engineering complexity | Medium (one-time enumeration of `__capyGame` surface; scoped input patch) |
| Mobile usability | High (analog steering, real brake, unified HUD) |
| Performance | Improved (remove React/iframe overhead, quality tiers) |
| Maintainability | High (single input/UI authority) |
| Provenance/legal | Low–medium (patches the user's own bundle; no redistribution of foreign source) |
| Risk | Medium (minified-bundle patch must be versioned + regression-tested) |
| Time to playable | Moderate |
| Extensibility | Good (normalized input state enables tilt/gamepad later) |

**This is the recommended path.** It preserves the game's proven mechanics while fixing exactly the layer that is broken, and it is the only option that reaches a native-feeling mobile game without a full rewrite.

## Option C — Independent rebuild (unified rendering/input/UI ownership)

Reimplement the game in a clean codebase (fresh Three.js/Rapier project) using REA-documented mechanics (vehicle tuning, drift tiers, cargo, missions, scoring).

| Dimension | Assessment |
| :--- | :--- |
| Engineering complexity | Very high (re-derive all systems from the minified bundle) |
| Mobile usability | Highest possible |
| Performance | Highest possible |
| Maintainability | Highest (own source) |
| Provenance/legal | Low (clean-room), but risk of unintended look/feel drift |
| Risk | High (feature parity is hard to guarantee) |
| Time to playable | Longest |
| Extensibility | Highest |

**Verdict:** right long-term destination if full source control is desired, but disproportionate near-term risk/effort given the engine already works and is owned.

## Decision

**Option B.** Gate the full rewrite (Option C) behind a later decision after Option B is proven. The critical dependency is enumerating `window.__capyGame`'s exposed surface to determine whether input is bindable via a public API (preferred) or requires a scoped patch.

## Residual risks to manage (Option B)

1. `bC`/`Di`/`Hg` may be closure-private → requires a minimal, documented bundle patch (versioned against the 6.29 MB bundle hash).
2. Bundle is already hand-patched in `d85908d` (+16 lines); further edits must be tracked and reproducible.
3. iOS fullscreen/audio quirks need game-context-level handling, not shell-level.
