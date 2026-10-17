# Ryder navigation HUD — Phase 2G

## Contract and ownership

`src/lib/navigation/adapter.ts` is a read-only adapter over the canonical Phone presentation mirrors documented in `RYDER_NAVIGATION_AUDIT.md`. It copies finite scalar coordinates and bounded geometry into Ryder-owned snapshots. It never calls bike telemetry, Rapier, rigid bodies, input handles, mission methods or scene mutation APIs. No second mission state machine is introduced.

The canonical Phone phase selects the target: `drive-to-store` uses `_storePos`; `delivering` uses `_deliveryPos`. An active order is mandatory. Its customer/destination strings supply descriptive text only, never coordinates. Pickup is labelled Grocery pickup because a reliable store name was not established. Distance is Euclidean x/z meters, matching canonical Maps, not a promise of road distance. Bearing is `atan2(dx,dz)-heading`, wrapped to ±π. The up arrow rotates relative to the player's canonical copied heading.

Roads are copied from `_mapRoads`, limited to 256 roads, 96 points per road and 12,000 total finite points. A WeakMap caches the owned copy by the plain geometry array identity; scene replacement allows old data to be collected. `_mapRoute` is copied to at most 128 points and remains canonical route guidance. No new graph, routing or pathfinding runs in production. Missing geometry does not invalidate direction/distance.

## Rendering and visibility

`installNavigationHud` owns one passive DOM card, a 136×108 backing canvas displayed at 68×54, its stylesheet and a 125ms independent UI timer. Text/bearing snapshots update at 8Hz, drawing at 2Hz. The north-up map follows canonical x-right/z-down coordinates; player arrow rotation is π-heading. The target dot clamps to the edge when outside the local view; this is direct-target guidance, not turn-by-turn navigation.

The card occupies the upper-left safe area, above the frozen movement surface. It and every descendant use `pointer-events:none`. No input listeners or interactive descendants exist. Visibility requires the live WORLD state, in-game body, world/driving canonical mode, relevant active objective, landscape, visible document, closed Phone, and a visible/non-inert outer React shell. Boot, menu, shop, Phone, store, disconnected, portrait, Stats and missing/invalid targets hide it. Tip/help presentation shifts beside the card; native tip dismissal behavior remains.

App iframe-generation cleanup disposes the timer, DOM and stylesheet before replacement and on unmount. No production runtime object is exported or assigned. Test-readable DOM data contains only copied phase, target and distance primitives.

## Phone Maps resize

`product/phone-layout.ts` separately checks visible canonical Maps canvas dimensions every 200ms and invokes its existing `_resize()` only when the presentation size differs. Static audit established that this method changes canvas size, context transform and cached `_w/_h` only. No method wrapping, engine patch, DOM-observer runtime read, physics callback or map rebuild is involved.

## Limits

Road context may be omitted when unavailable or beyond bounded detail. The cached canonical route can lag the current starting position. Labels are canonical descriptive order text; distances are direct horizontal distance. Physical iPhone readability/usefulness and Safari rotation still require human acceptance. The HUD must not be used as a telemetry source for Stats.
