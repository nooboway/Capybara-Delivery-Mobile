# Phase 2D-R1 runtime isolation — 2026-10-15

Production remains unchanged during isolation; HEAD is 92885c037f80310873373bc784613a901dce99ca. Canonical SHA remains C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E.

The first failure occurs inside Rapier world.step. The subsequent rbTranslation unsafe-aliasing messages occur after that first trap. Attribution remains unresolved.

Controlled full-sequence overlays still fail after independently removing audio bridge, driving gestures, screenshots, trusted Phone/Close pointer path, or Phone positioning/ResizeObserver. Removing driving plus the audio verification block also fails. Instrumentation recorded no watched Ryder callbacks within the physics step.

A marker-only overlay adds data-touch-control to the Ryder root and Close button. Native camera ownership is false for those touches, but the full suite still reports 32/33 with the same first Rapier trap. This is not a proven correction and has not been applied to production.

A confirmed compact sequence uses normal startup, the unchanged production input module, viewport changes, trusted Capy Food and Accept taps, then three mixed trusted-pointer/keyboard Phone cycles. Acceptance is explicitly confirmed as active=true, phase=drive-to-store. It completes 211 physics frames with zero runtime errors. This narrower result does not close the full-suite blocker.

Extended repetition and gameplay-gate-only overlays are in progress. No corrective commit or push has been created. The six functional P0 corrections remain uncommitted and preserved.

## Additional reduction results

The extended confirmed-order reduction reproduces the same first Rapier world.step trap during cycle 7 (zero based), after cycle 6 was clean at 270 physics frames. At failure it reports 310 frames, zero normalized driving, zero forward speed and zero velocity. It uses no driving gestures, audio verification, media spy, screenshots, telemetry reads or full-suite assertions. Three cycles had previously been clean, so that earlier short result was insufficient.

The gameplay visibility gate disabled in a test-only prototype overlay does not prevent the failure (28/33: four expected pre-game visibility assertion failures plus the runtime-error gate). The production gate remains intact.

Next reduction: prolonged no-interaction idle versus repeated Phone cycles without opening Capy Food or accepting an order. This separates elapsed simulation/repetition from order acceptance.

The prolonged idle reduction reproduces the first Rapier trap at 331 physics frames, followed by unsafe-aliasing errors, with no post-startup Phone, order, driving, audio verification, screenshots, viewport changes or state-reader calls. Last plain values remain finite and neutral. Thus none of those interaction sequences is necessary. A no-integration overlay is now comparing the same normal startup/idle with no Okada module injection and the Ryder audio script reference removed only from the served response.

The no-integration idle overlay also reproduces the identical first Rapier world.step trap, at 376 frames. It does not inject/init Okada input and strips the sole uncommitted HTML change (the Ryder audio script reference) from the served response. Production files remain untouched. Phone-only extended repetition also fails at 313 frames.

This demonstrates that the new Ryder input/audio integrations and the six correction subsystems are not necessary for the reproduced failure. It does not establish whether the canonical/runtime failure is environment-specific. A default-GPU browser-launch comparison is in progress; the previous harness forced --disable-gpu.

## Final isolation conclusion

The forced-GPU-disabled no-integration case is repeated with only a primitive completed-frame counter, no per-frame position/dynamics reads. Normal gameplay is confirmed, inputPresent=false, audioBridge=false. It reproduces at 384 successful frames, after 150531ms observation (251832ms total), with 30 runtime errors. This independently excludes diagnostic physics reads as necessary triggers.

The otherwise equivalent normal-GPU no-integration case completes 604 frames with zero errors. The current full production integration with normal Chromium rendering then passes 1200 idle frames (20391ms), 1200 post-order/driving frames (20244ms), 33/33 and zero runtime errors. The harness correction removes --disable-gpu, without changing timestep, simulation, canonical code or production input. Exact internal Rust panic mechanics are not decoded; the reproducible condition is the forced-GPU-disabled harness environment.

No unsafe retained physics reference was identified. The Brake/Reverse helper is not an idle reader, returns a primitive, and is absent from the canonical reproductions. No production stability workaround was introduced. Only the already authorized six P0 production corrections are retained.
