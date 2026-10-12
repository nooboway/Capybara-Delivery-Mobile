/**
 * Touch input source (Phase 1C — corrective integration).
 *
 * Correctness fixes over Phase 1:
 *  - F1: distinct style/root IDs; root is validated as a real DIV element.
 *  - F3: real pointer ownership — buttons use a multi-owner set (active while
 *    any pointer is down); analog controls use an exclusive owner pointerId.
 *  - F2: a real `reset(reason)` that clears contribution, visuals, ownership,
 *    and pointer state, so stale actions cannot resurrect.
 *  - F4: mode-based visibility driven by the game's own `body.in-store-mode`
 *    signal (walking stick only in store mode; driving controls otherwise).
 *
 * Visuals remain minimal debug controls; Phase 2 owns the final presentation.
 */
import type { OkadaInputManager } from "../input-manager";
import type { InputContribution } from "../types";

const STYLE_ID = "okada-phase1-controls-style";
const ROOT_ID = "okada-phase1-controls-root";

type Mode = "driving" | "store";

function safeCapture(el: Element, pointerId: number): void {
  try {
    (el as HTMLElement & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(pointerId);
  } catch {
    // Synthetic/disposed pointer (e.g. automated tests); ownership still tracked.
  }
}

export class TouchInputSource {
  private contribution: InputContribution = {};

  // Digital button ownership: buttonId -> set of active pointer ids (Policy A).
  private buttonOwners = new Map<string, Set<number>>();
  // Analog exclusive ownership.
  private steerOwner: number | null = null;
  private steerOriginX = 0;
  private walkOwner: number | null = null;

  private root: HTMLElement | null = null;
  private steerKnob: HTMLElement | null = null;
  private walkKnob: HTMLElement | null = null;
  private walkEl: HTMLElement | null = null;
  private mode: Mode = "driving";
  private observer: MutationObserver | null = null;
  private attached = false;

  constructor(
    private doc: Document,
    private manager: OkadaInputManager,
  ) {}

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    this.injectStyles();
    this.root = this.ensureRoot();
    this.buildSteer();
    this.buildButton("okada-btn-throttle", "GAS", () => (this.contribution.throttle = 1), () => (this.contribution.throttle = 0), "right:24px;bottom:120px;");
    this.buildButton("okada-btn-brake", "BRK", () => (this.contribution.brake = 1), () => (this.contribution.brake = 0), "right:24px;bottom:24px;");
    this.buildButton("okada-btn-drift", "DRIFT", () => (this.contribution.drift = true), () => (this.contribution.drift = false), "right:110px;bottom:120px;");
    this.buildButton("okada-btn-interact", "E", () => (this.contribution.interact = true), () => (this.contribution.interact = false), "right:110px;bottom:210px;");
    this.buildWalkStick();
    this.readMode();
    this.observeMode();
  }

  detach(): void {
    this.stopModeObserver();
    this.releaseAllControls();
    this.contribution = {};
    this.manager.release("touch");
    this.root?.remove();
    this.root = null;
    const style = this.doc.getElementById(STYLE_ID);
    style?.remove();
    this.attached = false;
  }

  /** Full reset of source-owned state (blur, visibility, teardown, mode change). */
  reset(reason?: string): void {
    void reason;
    this.releaseAllControls();
    this.contribution = {};
    this.manager.release("touch");
  }

  /** Called by the mode observer when the game enters/leaves store mode. */
  setMode(mode: Mode): void {
    if (mode === this.mode) return;
    const previous = this.mode;
    this.mode = mode;
    // Never carry input across a mode boundary.
    if (previous === "store") {
      // leaving store: clear walking
      this.contribution.walkX = 0;
      this.contribution.walkY = 0;
      this.walkOwner = null;
      this.resetStickVisual();
    } else {
      // entering store: clear driving
      this.contribution.steer = 0;
      this.contribution.throttle = 0;
      this.contribution.brake = 0;
      this.contribution.reverse = 0;
      this.contribution.drift = false;
      this.contribution.interact = false;
    }
    this.applyVisibility();
    this.apply();
  }

  private injectStyles(): void {
    if (this.doc.getElementById(STYLE_ID)) return;
    const el = this.doc.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      #${ROOT_ID} { position: fixed; inset: 0; z-index: 9000; pointer-events: none; }
      #${ROOT_ID} > * { pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none; }
      .okada-btn { position: fixed; width: 64px; height: 64px; border-radius: 50%;
        background: rgba(20,30,50,0.6); color:#fff; font-weight:700; font-size:12px;
        display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.5); }
      .okada-btn.pressed { background: rgba(56,189,248,0.6); }
      #okada-steer { position: fixed; left: 20px; bottom: 24px; width: 180px; height: 120px;
        border-radius: 16px; background: rgba(20,30,50,0.35); border:2px solid rgba(255,255,255,0.3); }
      #okada-steer .knob { position:absolute; top:50%; left:50%; width:40px; height:40px; border-radius:50%;
        transform: translate(-50%,-50%); background: rgba(56,189,248,0.8); }
      #okada-walk { position: fixed; left: 24px; bottom: 24px; width: 140px; height: 140px;
        border-radius: 50%; background: rgba(20,30,50,0.35); border:2px solid rgba(255,255,255,0.3);
        display: none; }
      #okada-walk .knob { position:absolute; top:50%; left:50%; width:48px; height:48px; border-radius:50%;
        transform: translate(-50%,-50%); background: rgba(34,197,94,0.8); }
      #${ROOT_ID}.mode-store .driving-control { display: none !important; }
      #${ROOT_ID}.mode-store #okada-walk { display: block !important; }
      /* Temporary coexistence: suppress the engine's native binary mobile controls
         while the Okada normalized layer owns input. Phase 2 owns final control set. */
      #mobile-controls { display: none !important; }
    `;
    this.doc.head.appendChild(el);
  }

  private ensureRoot(): HTMLElement {
    let el = this.doc.getElementById(ROOT_ID);
    if (el && el.tagName === "DIV") return el as HTMLElement;
    // Wrong element type (should not happen with distinct IDs) — remove and recreate.
    if (el) el.remove();
    const root = this.doc.createElement("div");
    root.id = ROOT_ID;
    this.doc.body.appendChild(root);
    return root;
  }

  private buildSteer(): void {
    const root = this.ensureRoot();
    const el = this.doc.createElement("div");
    el.id = "okada-steer";
    el.className = "driving-control";
    const knob = this.doc.createElement("div");
    knob.className = "knob";
    el.appendChild(knob);
    root.appendChild(el);
    this.steerKnob = knob;

    el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.steerOwner !== null) return; // exclusive owner
      e.preventDefault();
      this.steerOwner = e.pointerId;
      this.steerOriginX = e.clientX;
      safeCapture(el, e.pointerId);
    });
    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (e.pointerId !== this.steerOwner) return;
      const dx = e.clientX - this.steerOriginX;
      const v = Math.max(-1, Math.min(1, dx / 60));
      this.contribution.steer = Math.abs(v) < 0.05 ? 0 : v;
      knob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
      this.apply();
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.steerOwner) return;
      this.steerOwner = null;
      this.contribution.steer = 0;
      knob.style.transform = "translate(-50%,-50%)";
      this.apply();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }

  private buildButton(
    id: string,
    label: string,
    onPress: () => void,
    onRelease: () => void,
    css: string,
  ): void {
    const root = this.ensureRoot();
    const el = this.doc.createElement("button");
    el.type = "button";
    el.id = id;
    el.className = "okada-btn driving-control";
    el.textContent = label;
    el.style.cssText = css;
    root.appendChild(el);
    let owners = this.buttonOwners.get(id);
    if (!owners) {
      owners = new Set();
      this.buttonOwners.set(id, owners);
    }
    const down = (e: PointerEvent) => {
      e.preventDefault();
      safeCapture(el, e.pointerId);
      owners.add(e.pointerId);
      if (owners.size === 1) {
        el.classList.add("pressed");
        onPress();
        this.apply();
      }
    };
    const up = (e: PointerEvent) => {
      if (!owners.has(e.pointerId)) return;
      owners.delete(e.pointerId);
      if (owners.size === 0) {
        el.classList.remove("pressed");
        onRelease();
        this.apply();
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
  }

  private buildWalkStick(): void {
    const root = this.ensureRoot();
    const el = this.doc.createElement("div");
    el.id = "okada-walk";
    const knob = this.doc.createElement("div");
    knob.className = "knob";
    el.appendChild(knob);
    root.appendChild(el);
    this.walkEl = el;
    this.walkKnob = knob;

    const move = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const c = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
      let dx = cx - c.x;
      let dy = cy - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > c.r) {
        dx = (dx / dist) * c.r;
        dy = (dy / dist) * c.r;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const nx = dx / c.r;
      const ny = dy / c.r;
      const mag = Math.hypot(nx, ny);
      const dead = 0.18;
      if (mag < dead) {
        this.contribution.walkX = 0;
        this.contribution.walkY = 0;
      } else {
        const s = (mag - dead) / (1 - dead);
        this.contribution.walkX = (nx / mag) * s;
        this.contribution.walkY = -(ny / mag) * s; // screen up = forward
      }
      this.apply();
    };

    el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.walkOwner !== null) return; // exclusive owner
      e.preventDefault();
      this.walkOwner = e.pointerId;
      safeCapture(el, e.pointerId);
      move(e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (e.pointerId !== this.walkOwner) return;
      move(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== this.walkOwner) return;
      this.walkOwner = null;
      this.contribution.walkX = 0;
      this.contribution.walkY = 0;
      knob.style.transform = "translate(-50%,-50%)";
      this.apply();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }

  private readMode(): void {
    const store = !!this.doc.body?.classList?.contains("in-store-mode");
    this.setMode(store ? "store" : "driving");
  }

  private observeMode(): void {
    if (!this.doc.body) return;
    this.observer = new MutationObserver(() => this.readMode());
    this.observer.observe(this.doc.body, { attributes: true, attributeFilter: ["class"] });
  }

  private stopModeObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private releaseAllControls(): void {
    this.buttonOwners.forEach((owners) => owners.clear());
    for (const el of Array.from(this.doc.querySelectorAll(".okada-btn.pressed"))) el.classList.remove("pressed");
    this.steerOwner = null;
    this.contribution.steer = 0;
    this.walkOwner = null;
    this.contribution.walkX = 0;
    this.contribution.walkY = 0;
    this.contribution.throttle = 0;
    this.contribution.brake = 0;
    this.contribution.reverse = 0;
    this.contribution.drift = false;
    this.contribution.interact = false;
    this.resetStickVisual();
  }

  private resetStickVisual(): void {
    this.steerKnob && (this.steerKnob.style.transform = "translate(-50%,-50%)");
    this.walkKnob && (this.walkKnob.style.transform = "translate(-50%,-50%)");
  }

  private applyVisibility(): void {
    if (!this.root) return;
    this.root.classList.toggle("mode-store", this.mode === "store");
  }

  private apply(): void {
    this.manager.apply("touch", { ...this.contribution });
  }
}
