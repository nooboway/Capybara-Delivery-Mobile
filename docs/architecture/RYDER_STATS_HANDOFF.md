# Ryder Stats handoff — Phase 2F

This phase implements only a local ownership replacement. It does not implement telemetry, persistence, a Stats API or leaderboards.

## Current navigation

The canonical menu Stats button previously opened `https://capybara-vibejam26.leocoout.dev/stats` in another window, without player/session query parameters. The Ryder product adapter now captures that button before its canonical handler and opens the parent application's `/stats` route. The shell says: “Your persistent stats and leaderboard are coming soon.” It contains no metrics, sample players, fabricated rank, fetch or submission. Back to Game returns to the same game iframe; menu state survives. The original external Stats navigation dependency is removed from normal player flow, although the URL remains inside the unchanged canonical bundle.

The hosting configuration contains a narrow `/stats` → `/index.html` rewrite for direct entry and refresh. It does not rewrite game assets or change the build/output configuration.

Phone leaderboard = session ranking, retained. More precisely, this is a **session-network** ranking: the canonical module reads NetClient.lastLeaderboard, subscribes to NET_LEADERBOARD/CONNECTED/DISCONNECTED, and highlights the current connection ID. It is independent of the public Stats dashboard and is hidden by canonical offline behavior. It is not a persistent Ryder lifetime leaderboard. Phase 2F preserves it; a live multiplayer backend was not fabricated for verification.

The separate legacy analytics sender is also unchanged: same-origin `POST /api/event`, sessionStorage-scoped session ID, memory queue cap 100, periodic/unload flushing, disabled by default on localhost. Original `order.success`/`order.failure` events and menu/support/music events are not a durable Ryder event contract. There is no registered receiver in the inspected Express routes or checked-in static Vercel deployment. Local network testing cannot validate its non-localhost flushing, and remote hosting overrides remain unverified. Removing the public Stats link does not claim to delete this canonical sender.

## Future Phase 3A target — not implemented

```text
Ryder game
    ↓
Ryder telemetry
    ↓
Ryder Stats API
    ↓
Ryder database
    ↓
Player Stats + History + Leaderboards
```

Later work should define persistent anonymous player identity and display names; versioned event ingestion with eventId deduplication; a bounded retry queue; lifetime totals; recent delivery history; daily, weekly and all-time leaderboards; own-player rank; and Ryder-owned Stats UI. Use server validation and idempotent aggregation rather than trusting client-submitted totals. Choose storage, retention, abuse controls and identity recovery deliberately after Phase 3A authorization.

The existing audit proposes PostgreSQL/Drizzle/Zod, an asynchronous disposable integration and actual Vercel API handlers with API-before-SPA routing. Repository database scaffolding is not a provisioned database or deployed Stats service. Static candidate lifecycle seams include normal Phone acceptance, store transition and guarded delivery completion; they still need runtime contract validation, especially separate group-completion paths. Reuse the prior evidence rather than infer lifetime totals from session money or the old analytics envelope. No provider, database, secret, migration or API handler is created here.

Known gaps: no verified stable delivery-complete event seam, persistent identity, trusted economic ledger, server clock/ranking windows, ingestion authentication, retry durability or reconciliation contract. Runtime observation must avoid Rapier object reads during physics/render callbacks. Do not add synchronous telemetry readers to close a UI gap. Session leaderboard events are not evidence of lifetime statistics. Future architecture must distinguish offline activity, multiplayer session ranking, and persistent records.

## Audit references

- `RYDER_EXTERNAL_LINK_AUDIT.md`: original destinations, navigation guard, network evidence and legal classification.
- Existing read-only audit artifacts `RYDER_ORIGINAL_STATS_AUDIT.md`, `RYDER_STATS_ARCHITECTURE.md`, `../audit/PHASE_3A_STATS_CALL_INVENTORY.json`, `../ux/PHASE_3A_STATS_LEADERBOARDS.md` were present before this phase. They are preserved unchanged and excluded from the Phase 2F commit; their existence is not authorization to implement them.
- `../ux/PHASE_2F_PRODUCT_CLEANUP.md` and `../ux/evidence/phase2f-product-cleanup.log`: current shell/UI evidence.

Stop gate: physical iPhone Safari product/control retest remains required. Do not treat Chromium touch emulation as physical acceptance or start Phase 3A automatically.
