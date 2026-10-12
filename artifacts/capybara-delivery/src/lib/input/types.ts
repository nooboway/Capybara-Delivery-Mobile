/**
 * Okada normalized input model.
 *
 * This is the single source of truth for game *actions* (not keyboard keys),
 * owned by Okada. Minified engine internals (rC/bC/Di/Hg) stop at the
 * engine-adapter boundary and never leak into this layer.
 */

export type InputSourceId = "touch" | "gamepad" | "tilt";

export interface OkadaInputState {
  /** Continuous steering, -1 (full left) .. +1 (full right). */
  steer: number;
  /** Throttle 0..1. The engine consumes a binary on/off channel; see contract. */
  throttle: number;
  /** Dedicated brake 0..1. Distinct from reverse. */
  brake: number;
  /** Reverse 0..1. Distinct from brake (engine reverses torque direction). */
  reverse: number;
  /** Handbrake/drift (same engine action as `shift`). */
  drift: boolean;
  /** Interact (E). Level-triggered; the engine performs its own edge detection. */
  interact: boolean;
  /** Wheelie (F). */
  wheelie: boolean;
  /** Phone / menu action (game-owned phone UI, not a physics input). */
  phone: boolean;
  /** On-foot lateral movement, -1 (left) .. +1 (right). */
  walkX: number;
  /** On-foot longitudinal movement, -1 (backward) .. +1 (forward). */
  walkY: number;
}

/** A source's partial contribution. Only non-neutral fields need to be set. */
export interface InputContribution {
  steer?: number;
  throttle?: number;
  brake?: number;
  reverse?: number;
  drift?: boolean;
  interact?: boolean;
  wheelie?: boolean;
  phone?: boolean;
  walkX?: number;
  walkY?: number;
}

export function neutralState(): OkadaInputState {
  return {
    steer: 0,
    throttle: 0,
    brake: 0,
    reverse: 0,
    drift: false,
    interact: false,
    wheelie: false,
    phone: false,
    walkX: 0,
    walkY: 0,
  };
}

export function isNeutralContribution(c: InputContribution): boolean {
  return !(
    (c.steer ?? 0) !== 0 ||
    (c.throttle ?? 0) > 0 ||
    (c.brake ?? 0) > 0 ||
    (c.reverse ?? 0) > 0 ||
    c.drift ||
    c.interact ||
    c.wheelie ||
    c.phone ||
    (c.walkX ?? 0) !== 0 ||
    (c.walkY ?? 0) !== 0
  );
}
