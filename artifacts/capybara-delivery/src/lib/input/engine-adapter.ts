/**
 * OkadaEngineAdapter — the ONLY place that knows about minified engine
 * internals (the `rC` input object). It resolves the live input object at
 * runtime from an exposed game reference, then overrides its getters to inject
 * normalized values, falling back to the engine's native keyboard/touch path
 * when no normalized source is active.
 *
 * Phase 1C additions:
 *  - preserves the engine's input lock (`Ft`, surfaced as the
 *    `body.tutorial-locked` DOM class) so normalized input is suppressed
 *    whenever the engine suppresses native input;
 *  - records and can restore the original property descriptors on dispose.
 */
import type { OkadaInputManager } from "./input-manager";

/** Getter names on the engine's input abstraction (`rC`). */
const INPUT_GETTERS = [
  "steerDir",
  "forward",
  "backward",
  "brake",
  "shift",
  "interact",
  "wheelie",
  "walkVec",
] as const;

type EngineInput = Record<string, unknown>;
type DescriptorEntry = { key: string; desc: PropertyDescriptor };

export class OkadaEngineAdapter {
  private rC: EngineInput | null = null;
  private doc: Document | null = null;
  private originals = new Map<string, () => unknown>();
  private originalDescriptors: DescriptorEntry[] = [];
  private overridden = false;
  private manager: OkadaInputManager | null = null;

  /**
   * Resolve the live input object. Returns true if found and shape-validated.
   * The engine stores a reference to its single input abstraction on the world
   * controller (`_lastInput`), which is reachable from `window.__capyGame`.
   */
  resolve(win: Window): boolean {
    if (this.rC) return true;
    this.doc = win.document;
    const g = (win as unknown as { __capyGame?: Record<string, unknown> }).__capyGame;
    const world = g?.["world"] as Record<string, unknown> | undefined;
    const destructibles = (world?.["rapierContacts"] as Record<string, unknown> | undefined)?.[
      "destructibles"
    ] as Record<string, unknown> | undefined;
    const candidates: unknown[] = [
      world?.["_lastInput"],
      destructibles?.["_lastInput"],
    ];
    for (const c of candidates) {
      if (c && this.hasInputShape(c as EngineInput)) {
        this.rC = c as EngineInput;
        return true;
      }
    }
    return false;
  }

  isResolved(): boolean {
    return this.rC !== null;
  }

  getEngineInput(): EngineInput | null {
    return this.rC;
  }

  /** Validate that an object has the engine input getter shape. */
  private hasInputShape(o: EngineInput): boolean {
    return ["steerDir", "walkVec", "forward", "backward", "brake", "shift", "interact"].every((k) => {
      const d = Object.getOwnPropertyDescriptor(o, k);
      return !!(d && typeof d.get === "function");
    });
  }

  /** Whether the engine is currently suppressing input (tutorial lock). */
  private isLocked(): boolean {
    try {
      return !!this.doc?.body?.classList?.contains("tutorial-locked");
    } catch {
      return false;
    }
  }

  /** Override the input getters to inject normalized values (idempotent). */
  override(manager: OkadaInputManager): void {
    if (!this.rC || this.overridden) return;
    this.manager = manager;
    for (const key of INPUT_GETTERS) {
      const d = Object.getOwnPropertyDescriptor(this.rC, key);
      if (!d || typeof d.get !== "function") continue;
      const original = d.get.bind(this.rC);
      this.originals.set(key, original);
      this.originalDescriptors.push({ key, desc: d });
      Object.defineProperty(this.rC, key, {
        configurable: true,
        enumerable: d.enumerable,
        get: () => this.compute(key),
      });
    }
    this.overridden = true;
  }

  /** Restore original getter descriptors (dispose). Idempotent. */
  restore(): void {
    if (!this.rC || !this.overridden) return;
    for (const { key, desc } of this.originalDescriptors) {
      try {
        Object.defineProperty(this.rC, key, desc);
      } catch {
        // Ignore: the object may already be detached; nothing to restore into.
      }
    }
    this.originals.clear();
    this.originalDescriptors = [];
    this.overridden = false;
    this.manager = null;
  }

  private original(key: string): unknown {
    const fn = this.originals.get(key);
    return fn ? fn() : null;
  }

  private compute(key: string): unknown {
    const state = this.manager?.getState();
    // Preserve the engine input lock: when locked, never inject normalized values.
    if (this.isLocked()) return this.original(key);
    if (!state) return this.original(key);
    switch (key) {
      case "steerDir":
        return state.steer !== 0 ? state.steer : this.original(key);
      case "forward":
        return state.throttle > 0 ? true : this.original(key);
      case "backward":
        return state.reverse > 0 ? true : this.original(key);
      case "brake":
        return state.brake > 0 ? true : this.original(key);
      case "shift":
        return state.drift ? true : this.original(key);
      case "interact":
        return state.interact ? true : this.original(key);
      case "wheelie":
        return state.wheelie ? true : this.original(key);
      case "walkVec": {
        const active = state.walkX !== 0 || state.walkY !== 0;
        if (active) {
          // engine forward is -z; walkY(+forward) -> z(-)
          return { x: state.walkX, z: -state.walkY, active: true };
        }
        return this.original(key);
      }
      default:
        return this.original(key);
    }
  }
}
