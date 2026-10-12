# Performance — Measurements & Budgets

> Only measured/source-derived facts are stated; no invented frame-rates.

## 1. Measured payloads (verified)

| Asset | Size |
| :--- | :--- |
| `main-CSpZwCDB.js` | **6.29 MB** (single un-minified-for-network, minified bundle) |
| 4 code-split chunks (music/maps/leaderboard/capyMessage) | ~35 KB total |
| `/p/*.bin` asset packs | **20 files, 90.35 MB** |
| fonts (woff2) | ~78 KB |
| images (logos/loading) | ~5.5 MB |

## 2. Findings (source-verified)

1. **Monolithic 6.29 MB main bundle** — parsed/JIT-compiled on the main thread before first frame. On mid/low mobile this is the dominant startup cost. (Antigravity reported a 3.5–6.2 s main-thread stall on mid-tier SoCs — **UNVERIFIED** here, but the 6.29 MB payload makes a multi-second parse unavoidable.)
2. **Eager asset preload** — `d85908d` changed `wq()` to preload all packs at boot (Antigravity report B14). Trade-off: fast in-scene transitions vs. ~90 MB up-front download on first visit. **RECOMMENDATION**: stream packs per-scene with a Cache API/service-worker pre-warm instead of eager-everything.
3. **DPR** — `setPixelRatio` + `devicePixelRatio` present; the 1.5 clamp was a bundle patch. **RECOMMENDATION**: keep `min(devicePixelRatio, 1.5)` and add a quality-tier ladder (low/medium/high) that also gates shadows, post-processing, and particle counts.
4. **Rendering** — Three.js WebGL with shadow mapping, bloom/vignette, particle emitters, and static mesh batching (514 roads → 23 draws reported). Batching is good; the shadow/post stack is the mobile risk.
5. **Network waterfall** — `asset-proxy.js` tries local `/p/*.bin` then falls back to `/api/game-assets/*.bin`, which the server may itself proxy upstream — a potential double-latency path for a cache miss.

## 3. Quality-tier budget (RECOMMENDATION)

| Tier | Target | DPR | Shadows | Post (bloom/vignette) | Particles | Asset packs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Low | budget Android (≤ 2019), 30–45 fps | 1.0 | off / baked | off | reduced | stream |
| Medium | mid SoCs (Snapdragon 7xx, A12+), 45–60 fps | 1.5 | 1024 maps | minimal | full | stream |
| High | desktop / flagship, 60 fps | ≤2.0 | 2048 maps | full | full | pre-warm |

## 4. Startup budget (RECOMMENDATION)

- **≤ 3 s to interactive** on a mid-tier device over 4G: defer non-critical chunks, load only the menu-critical pack first, stream the rest.
- Move `main-CSpZwCDB.js` behind code-splitting if upstream source is ever available (currently a closed bundle — see ARCHITECTURE_DECISION.md).

## 5. Not measured (do not claim)

- Per-device frame rates, thermal-throttling thresholds, and GPU memory are **not benchmarked** in this audit.
