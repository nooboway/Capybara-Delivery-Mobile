---
name: Capybara game scope and assets
description: Owner-approved mobile rebuild scope and the original game media hosting tradeoff.
---

The user confirmed this is their game and that they are authorized to reproduce it. The existing version works only on PC; the rebuild should add mobile support while preserving desktop.

**Why:** The user stated this scope for the game.
**How to apply:** Preserve the game’s recognizable behavior while prioritizing touch controls and responsive layouts alongside desktop input.

The original media manifest contains 342 files across 19 packs, totaling about 95 MB. Stream these packs from the existing game host through a fixed server-side proxy instead of checking the full library into Git. This keeps the repository smaller but makes game media dependent on that host.

**Why:** This preserves the full model and audio library without adding about 95 MB to Git history.
**How to apply:** Keep the existing asset-pack protocol and proxy when updating this rebuild. If it must run independently, migrate the packs to persistent app storage before removing the original host.
