# Ryder navigation audit — Phase 2G

Starting commit `6325d4c9f5381027b8870a2b407766a6f777a7ce`. Canonical SHA256 `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` verified before changes. This audit precedes HUD implementation.

The same-hash canonical Maps application already consumes a plain presentation mirror on Phone. The integration should copy those numbers rather than read bike telemetry, Rapier, or physics methods. Evidence here is bounded ordinary static source inspection, independently reviewed. REA MCP tools remain unavailable with previously diagnosed registration drift; no duplicate broad analysis or configuration repair was attempted. Prior same-hash partial REA inventory does not establish complete semantic analysis. Runtime corroboration belongs to the Phase 2G verification log.

| Data | Canonical source | Primitive | Stability/limit | Use |
| --- | --- | --- | --- | --- |
| Player position | `phone._playerPos.x,z`; `setPlayerPosition`, main line1068, character offset6287212 | Finite numbers | Canonical frame writes after scene update; stale outdoors while in store | Snapshot only in WORLD/driving objective mode |
| Heading | `phone._playerPos.angle`; main line1808 approximately offset6500019 | Radians | Canonical `atan2(_bikeFrame.forward.x,_bikeFrame.forward.z)` copied into Phone; no physics read required | Relative bearing and player marker |
| Objective phase | `phone.phase` and `phone.activeOrder` | String/presence | Canonical progression remains authoritative | Pickup only for drive-to-store, delivery only for delivering |
| Pickup coordinate | `phone._storePos.x,z` | Finite numbers | Acceptance chooses active mission scene/store before mirroring; do not assume a fixed world store | Actual store target |
| Delivery coordinate | `phone._deliveryPos.x,z` | Finite numbers | Chosen on store completion, before startDelivery | Read only in delivering phase |
| Labels | Active-order customer/destination strings | Strings | Descriptive strings generated with offer; **not coordinate identity** | Human label; never derive target coordinates from them |
| Distance | MapsApp._fmtDist, mapsApp-CKWE6H60.js line153 | Number | Euclidean x/z meters, not road-route length | Same straight-line calculation |
| Road context | `phone._mapRoads`, refreshPhoneMapData; getPolylines2D offset6056722 | `{id,kind,halfWidth,points:[x,z][]}` | Canonical sampled road curves; copy/cache finite points, bounded detail | Small informational mini-map |
| Canonical route | `phone._mapRoute`; _pushMissionRoute main1808 offset6476013; FZ offset6156163 | `{x,z}[]` or null | Already computed by canonical A* with maxSnap30. Cached start may lag current position; unavailable route is valid | Draw bounded copy; no new graph/pathfinding |
| Detailed Maps sizing | `phone._mapsApp._resize()` | Canvas dimensions | Source only resizes canvas/context and `_w,_h`; normal update otherwise caches size | Independently scheduled UI resize when visible dimensions change |

Maps source line153 directly reads these Phone mirrors for roads, route, target, heading and distance. Main line1808 updates them in the normal frame. Scene changes refresh Phone map geometry. Complete/fail clears activeOrder and returns phase to idle; stale coordinates must therefore never keep the HUD visible.

Visibility additionally follows existing Ryder WORLD input state, body gameplay state, Phone closure, outer Stats shell visibility, orientation barrier, binding connection and document visibility. No new mission state machine is needed. No instrumentation is inserted into render/physics or mutation callbacks. Geometry is reused for presentation only; roadmap graph internals are not assumed public or rebuilt.

Direction is direct target bearing relative to heading, not a promise of turn-by-turn routing. The optional mini-map may show canonical route context; absence of a route must not produce an invented road path. Canonical Phone Maps remains the separate detailed, interactive map; no Phone pixels, DOM or canvas are copied into the HUD.
