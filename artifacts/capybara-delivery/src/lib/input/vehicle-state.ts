/**
 * Minimal, isolated read of the canonical bike's signed forward speed.
 *
 * TouchInputSource must not reach into arbitrary private vehicle physics. This is
 * the single narrow semantic signal used by the combined BRAKE/REVERSE control:
 * `forwardSpeed` from the bike dynamics snapshot, or null when unavailable.
 */
export function readForwardSpeed(win: Window | null | undefined): number | null {
  try {
    const g = win as unknown as {
      __capyGame?: {
        world?: { _bikeTelemetry?: { getDynamics?: () => { forwardSpeed?: number } } };
      };
    };
    const dynamics = g?.__capyGame?.world?._bikeTelemetry?.getDynamics?.();
    const v = dynamics?.forwardSpeed;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
