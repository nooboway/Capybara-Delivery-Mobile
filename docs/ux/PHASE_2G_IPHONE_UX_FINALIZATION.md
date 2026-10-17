# Ryder — Phase 2G iPhone UX finalization

Status: READY FOR PHYSICAL RETEST. All required automated gates pass; physical iPhone Safari acceptance remains mandatory. Phase 2G is not declared physically accepted. No Phase 3A implementation. No push.

## Implementation

Cosmetics preserve the original canonical Back, Play, style and color nodes/listeners and the native garage/character preview. A fixed-height flex view gives Back its own header, Play its own footer and only the middle region internal scrolling. The type row appears before the compact color label/swatches. All three native types are included: helmet, crown and witch. Canonical ownership of the color group's visibility remains intact; its compact label hides with it for types without helmet-color choices. Online username heading/field semantics are preserved separately from the offline color heading. There is no synthetic selection state or replacement preview/camera. The studio credit moves away from Play while this view exists. Disposal restores reparented native nodes via markers.

Phone remains a portrait device inside an unchanged landscape page. Its frame uses a 1:2 aspect ratio, not transform scaling: a slightly wider ergonomic approximation of the conceptual 9:19.5 direction, retaining 44px targets at compact landscape sizes. Height is bounded by 90dvh, safe-area available height and 720px on tablet; centering accounts for asymmetric safe insets. Home has two columns. Offers retain their native actions, with scrollable item content and pinned actions. Only Phone content scrolls; the outer page stays fixed. Close remains in the frozen shared HUD. Canonical Maps stays the detailed navigation app, with an independent UI-only sizing check for its existing canvas resize method.

The informational navigation HUD is separately owned under `src/lib/navigation/`. See the audit and contract below for exact copied data, bounded geometry, heading conventions, visibility, lifecycle and limitations. No InputManager, EngineAdapter, canonical bundle, R3, audio, tutorial, vehicle controls, mission progression or physics code is changed.

## Required report

| # | Field | Result |
| --- | --- | --- |
| 1 | Starting SHA | `6325d4c9f5381027b8870a2b407766a6f777a7ce` |
| 2 | Final local SHA | Commit containing this report; exact SHA returned in final response. |
| 3 | Branch | `phase2g-iphone-ux` |
| 4 | Pushed | NO |
| 5 | Canonical SHA | `C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E` |
| 6 | Canonical unchanged | YES; no canonical/public or input production diff. |
| 7 | Back | Original native button in non-scrolling top-left header; original handler retained. |
| 8 | Play | Original native button in non-scrolling bottom-right footer; credit excluded. |
| 9 | Helmet selector architecture | Native horizontal type row, middle scrolling region, original selection/garage preview handlers. |
| 10 | Color selector architecture | Original canonical visibility-owned group after types; ten 44px swatches, horizontal overflow protection. |
| 11 | Cosmetic tests | PASS in 131/131 final UX suite: three types across eight sizes, ten colors, Back/Play/type/color reachability/order, original Back navigation and online username-field preservation/disposal. |
| 12 | Portrait Phone | YES; centered portrait frame inside landscape. |
| 13 | Phone aspect ratio | 1:2, no scaling. |
| 14 | Safe areas | Bounds and center derive from forwarded parent safe-area variables; maximum height 720px. |
| 15 | Phone scrolling | Home/app/item content internal; actions fixed in Phone; no outer scrolling. |
| 16 | Phone Close | Frozen shared HUD/original close path retained. |
| 17 | Capy Food | PASS: native Skip, actual Accept, close and subsequent actual motorcycle acceleration; 44px unobstructed actions. |
| 18 | Maps | PASS: original detailed Maps app, three live resizes while open; native Back/zoom/view controls retained with ≥44px targets. |
| 19 | Navigation audit | Completed before implementation; bounded ordinary static inspection, read-only independent review, runtime corroboration in suite. REA MCP unavailable; prior same-hash partial inventory is not a claim of semantic completion. |
| 20 | Player position | Finite copies of `phone._playerPos.x,z`. |
| 21 | Heading | Finite copy of `phone._playerPos.angle` (radians). |
| 22 | Objective | Actual canonical phase + active order; `_storePos` for pickup, `_deliveryPos` for delivery. |
| 23 | Distance | Euclidean x/z distance, same definition as canonical Maps, not route length. |
| 24 | Navigation adapter | Read-only, owned scalar/geometry snapshots; independent timer, no physics or observer callback reads. |
| 25 | Direction | Relative wrapped target bearing arrow. |
| 26 | Distance display | Rounded meters, one decimal kilometer for ≥1000m. |
| 27 | Destination label | Grocery pickup; canonical customer/descriptive destination during delivery. Never inferred coordinates. |
| 28 | Mini-map | YES |
| 29 | Mini-map source | Bounded copies of canonical Phone road polylines and existing route; no new pathfinding. |
| 30 | Store objective | PASS: actual accepted order, distance changes during real touch driving, native assigned-store entry/cart/items. |
| 31 | Customer objective | PASS: actual post-store target, distance changes during real touch driving, actual canonical delivery/result. |
| 32 | Mission-stage transition | Canonical phase selects/hides target, no parallel mission state. |
| 33 | HUD pointer-events | `none` on card and every descendant; no input handlers. |
| 34 | Phone visibility | HUD hides while Phone open; also menu/boot/shop/store/disconnected/portrait/hidden document/Stats/no objective. |
| 35 | Tip coexistence | Top tip/help placement beside navigation; lower subtitle remains separate; native dismissal safety retained. |
| 36 | Viewports | 667×375, 740×360, 780×360, 844×390, 896×414, 932×430, 1080×480, 1366×1024; all PASS in final UX suite. |
| 37 | Phase 2E regression | Complete production 62/62 PASS (first-time + returning, normal rendering, full delivery, disposal/reload, zero runtime errors); layout 41/41 and lifecycle 24/24 PASS. |
| 38 | Phase 2F regression | 66/66 PASS on final source, including promotional cleanup, Stats placeholder, menu/Phone fit and post-accept driving. |
| 39 | Phase 1 regression | 40/40 PASS, including canonical store interactions and native E. |
| 40 | R3 regression | 23/23 PASS. |
| 41 | Phase 2D regression | 30/30 PASS on unchanged recheck; initial legacy startup timeout retained separately. |
| 42 | Phase 2D-R1 regression | 33/33 PASS, including actual accept-close motion and music/SFX RMS mute/unmute. |
| 43 | Audio | 12/12 PASS. |
| 44 | Input startup | 8/8 PASS. |
| 45 | Tutorial bridge | 9/9 PASS. |
| 46 | Typecheck | Full application and strict input/immersive/product/navigation PASS. |
| 47 | Build | PASS; existing nonfatal tooltip sourcemap warning. |
| 48 | Runtime errors | ZERO in completed final UX, compatibility, R1 and complete production runs; no JavaScript/WASM unreachable/aliasing exception. Failed automation timeout is separately retained. |
| 49 | Screenshots | `screenshots/phase2g/`; settled default/type/color/Back+Play, Crown/Witch, Phone/home/CapyFood/Maps, store/customer navigation, tips, compact/tablet captures visually reviewed. |
| 50 | Docs | This report, `../architecture/RYDER_NAVIGATION_AUDIT.md`, `../architecture/RYDER_NAVIGATION_HUD.md`. |
| 51 | Remaining P0 | None demonstrated by completed automated gates. Physical retest remains mandatory. |
| 52 | Remaining P1 | Physical Safari readability, ergonomics, scrolling, rotation and actual safe areas await user retest. |
| 53 | Physical iPhone retest | REQUIRED. No physical acceptance claimed. |
| 54 | Recommendation | READY FOR PHYSICAL RETEST. STOP; do not begin Phase 3A. |

## Evidence and scope

The new suite uses normal React/canonical startup. Its isolated presentation/visibility fixtures are labelled separately from actual game checks. Offer scheduling and extended response time follow the established test fixture for stable capture; they do not assign an objective, position, velocity, items, mission completion or input-manager state. Full delivery uses the existing trusted touch driver and native Action interactions. The reusable driver is exported with an optional read-only observation callback. Its blocked-path recovery also uses a genuine reverse arc when heading error is small, rather than repeatedly reversing almost straight. All prior acceptance assertions, delivery radius and 360-second navigation timeout remain intact; no production control, position, velocity or mission state is assigned.

The Phase 2F regression has optional evidence/screenshot destinations so its original evidence is preserved. Its historical vertical-only Phone/Close separation assertion becomes proper two-dimensional rectangle non-overlap: the centered portrait frame sits beside the top-right HUD. This retains the actual fit/hit/44px/input restoration checks and 66-check count; portrait-ratio and extra UX checks live in the new suite.

All suites run sequentially to avoid concurrent GPU contention. Screenshot font-readiness bypass affects capture waiting only. The preservation manifest covers all 48 pre-existing modified/untracked files, including historical screenshots, diagnostic artifacts and read-only Stats audit documents; none is staged with this change. No production Stats/leaderboard implementation or new deployment is included.

Physical iPhone Safari retest must confirm Back/Play and all cosmetic types/colors, portrait Phone readability and scrolling, Accept/Skip/Close, Maps resize/rotation, restored driving after acceptance, navigation readability/usefulness, real safe areas and repeated Phone/orientation lifecycle. Successful automation cannot substitute for that acceptance.

## Final suite evidence

| Suite | Result | Log under `evidence/` |
| --- | --- | --- |
| Phase 2G final UX/delivery | 131/131 PASS | `phase2g-iphone-ux.log` |
| Complete Phase 2E production | 62/62 PASS | `phase2g-phase2e-production.log` |
| Phase 2F compatibility | 66/66 PASS | `phase2g-phase2f.log` |
| Navigation adapter | 11/11 PASS | `phase2g-navigation-adapter.log` |
| Phase 2E layout | 41/41 PASS | `phase2g-verify-phase2e-layout.log` |
| Phase 2E lifecycle | 24/24 PASS | `phase2g-verify-phase2e-lifecycle-console.log` |
| Phase 1 | 40/40 PASS | `phase2g-verify-engine-console.log` |
| R3 motion policy | 23/23 PASS | `phase2g-test_store_motion_policy.log` |
| Phase 2D | 30/30 PASS | `phase2g-verify-phase2d-recheck.log` |
| Phase 2D-R1 | 33/33 PASS | `phase2g-verify-phase2d-r1-console.log` |
| Audio | 12/12 PASS | `phase2g-verify-ryder-audio.log` |
| Input startup | 8/8 PASS | `phase2g-verify-input-startup.log` |
| Tutorial | 9/9 PASS | `phase2g-verify-tutorial-bridge.log` |
| Full application typecheck | PASS, exit 0 | `phase2g-app-typecheck.log` |
| Strict input/immersive/product/navigation typecheck | PASS, exit 0 | `phase2g-strict-typecheck.log` |
| Production build | PASS, exit 0 | `phase2g-build.log` |

The first legacy Phase 2D run timed out waiting for Play after its Offline click (`phase2g-verify-phase2d-console.log`). An unchanged isolated rerun passed all 30 checks. Static inspection confirms the native menu can display an enabled-looking Offline button while its internal loading-ready gate still ignores selection; the failed run did not record that private gate, so this is a plausible harness readiness race, not a proven root-cause claim. No production workaround or weakened assertion was added, and the failed attempt is not counted as a pass.

`phase2g-iphone-ux-development-pass.log` records an earlier 118-check development pass, not the final candidate. `phase2g-phase2e-pre-final-partial.log` records first-time controls passing before that run was deliberately stopped to rebuild the final online-heading safeguard. It is incomplete and is not credited as complete production acceptance. Final acceptance uses the complete final-source run only.

Default cosmetic capture now waits for canonical garage transition completion; type captures wait for their native visual transition. These are capture readiness changes, not selection/preview simulation or engine mutation.

## Screenshot index

| Required state | Capture under `screenshots/phase2g/` |
| --- | --- |
| Default cosmetics and native character preview | `cosmetic-default.png` |
| All helmet types | `cosmetic-helmet.png`, `cosmetic-crown.png`, `cosmetic-witch.png` |
| All colors | `cosmetic-colors.png` |
| Back and Play together | `cosmetic-back-play.png` |
| Crown selected | `cosmetic-crown.png` |
| Witch selected | `cosmetic-witch.png` |
| Portrait Phone in landscape | `phone-844x390.png` |
| Phone home | `phone-home.png` |
| Capy Food | `capy-food.png` |
| Detailed Maps | `phone-maps.png` |
| Store objective HUD | `navigation-store.png` |
| Customer objective HUD | `navigation-customer.png` |
| Tip plus navigation | `tip-with-navigation.png` |
| Compact iPhone viewport | `compact-navigation.png`, `phone-667x375.png` |
| Tablet | `tablet-navigation.png`, `phone-1366x1024.png` |

Canonical garage/helmet camera behavior is preserved, including its native close-up on selection. No camera framing or model geometry is altered. The eight requested viewport checks are browser measurements, not physical-device acceptance.

The initial complete-profile Phase 2E attempt on the final production candidate reached the customer leg after passing both 1,200-frame gates, store entry, cart/items and store exit, but timed out stationary near 78m from the customer (`phase2g-phase2e-obstacle-timeout.log`). Its existing recovery multiplied an already near-zero heading error, producing almost no steering while reversing into the same obstruction. The test-only driver now applies a ±0.65 reverse arc for 2.6s when error is small, alternating side across repeated attempts, and captures the first two obstructions plus primitive recovery results. This is physical touch navigation, not a gameplay/physics workaround. No target, mission completion or movement assertion is weakened; timeout/radius are unchanged. That failed run is retained and not credited as a pass. Complete production and UX suites are rerun with the improved test driver against identical production code.

The final complete production rerun passed **62/62**, including first-time and returning-player sessions, both 1,200-frame normal-rendering gates, actual store/cart/items/customer delivery, disposal and iframe reload, with zero runtime errors. The revised recovery was exercised en route to the store: normalized steering 0.65, reverse 1, throttle/brake 0, actual reverse speed -4; the driver then reached the assigned store and completed the delivery. Production source remained unchanged throughout this test-driver correction. All 48 unrelated files remain byte-identical to the preservation manifest and outside the local commit.

The final post-driver-refinement UX rerun also passed **131/131**, including actual canonical store/cart/items/customer delivery, changing store/customer distance, correct visibility and zero runtime exceptions. All required gates are now green. Physical iPhone Safari retest is still required; no ergonomic or physical acceptance is inferred. No push, merge, deployment or Phase 3A work is included.

Console evidence has trailing whitespace and terminal blank lines normalized for review; diagnostic text, values, ordering and suite results are unchanged.
