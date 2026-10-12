/**
 * OkadaInputManager — the single authoritative normalized input state.
 *
 * Sources (touch, gamepad, tilt) contribute values; the manager arbitrates and
 * resolves one normalized state. Keyboard is NOT a source here: it is consumed
 * natively by the engine and used as the adapter's fallback.
 *
 * Arbitration: each numeric axis is owned by the highest-priority source that
 * currently contributes a non-neutral value. When that source goes neutral or
 * releases, the axis falls through to the next active source, then to neutral
 * (which the adapter maps back to the engine's native keyboard path).
 */
import {
  type InputContribution,
  type InputSourceId,
  type OkadaInputState,
  isNeutralContribution,
  neutralState,
} from "./types";

const PRIORITY: InputSourceId[] = ["gamepad", "tilt", "touch"];

type Listener = (state: OkadaInputState) => void;

export class OkadaInputManager {
  private contributions = new Map<InputSourceId, InputContribution>();
  private state: OkadaInputState = neutralState();
  private listeners = new Set<Listener>();

  /** Record a source's contribution and recompute the resolved state. */
  apply(source: InputSourceId, contribution: InputContribution): void {
    if (isNeutralContribution(contribution)) {
      this.contributions.delete(source);
    } else {
      this.contributions.set(source, { ...contribution });
    }
    this.recompute();
  }

  /** Release a source entirely (pointer up / disconnect). */
  release(source: InputSourceId): void {
    this.contributions.delete(source);
    this.recompute();
  }

  /** Force every axis neutral (blur, visibility loss, teardown). */
  reset(): void {
    this.contributions.clear();
    this.recompute();
  }

  getState(): OkadaInputState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private recompute(): void {
    this.state = {
      steer: this.pickNumeric("steer"),
      throttle: this.pickNumeric("throttle"),
      brake: this.pickNumeric("brake"),
      reverse: this.pickNumeric("reverse"),
      drift: this.pickBoolean("drift"),
      interact: this.pickBoolean("interact"),
      wheelie: this.pickBoolean("wheelie"),
      phone: this.pickBoolean("phone"),
      walkX: this.pickNumeric("walkX"),
      walkY: this.pickNumeric("walkY"),
    };
    for (const l of this.listeners) l(this.state);
  }

  private pickNumeric(key: "steer" | "throttle" | "brake" | "reverse" | "walkX" | "walkY"): number {
    for (const src of PRIORITY) {
      const c = this.contributions.get(src);
      const v = c?.[key];
      if (v !== undefined && v !== 0) return v;
    }
    return 0;
  }

  private pickBoolean(key: "drift" | "interact" | "wheelie" | "phone"): boolean {
    for (const src of PRIORITY) {
      if (this.contributions.get(src)?.[key]) return true;
    }
    return false;
  }
}
