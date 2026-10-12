/**
 * Touch input source (Phase 1 — minimal/debug controls, correct event
 * architecture). Uses Pointer Events with setPointerCapture and tracks each
 * pointer independently so multiple simultaneous controls (steer + throttle +
 * drift) do not steal one another. Phase 2 replaces the visuals.
 */
import type { OkadaInputManager } from "../input-manager";
import type { InputContribution } from "../types";

interface AnalogControl {
  onDelta(dx: number, dy: number): void;
  onEnd(): void;
}

interface ButtonControl {
  onPress(): void;
  onRelease(): void;
}

const STYLE_ID = "okada-phase1-controls";

export class TouchInputSource {
  private contribution: InputContribution = {};
  private pointerHandlers = new Map<number, () => void>();

  constructor(
    private doc: Document,
    private manager: OkadaInputManager,
  ) {}

  attach(): void {
    this.injectStyles();
    const root = this.ensureRoot();
    this.buildSteer(root);
    this.buildButton(root, "okada-btn-throttle", "GAS", () => (this.contribution.throttle = 1), () => (this.contribution.throttle = 0), "right: 24px; bottom: 120px;");
    this.buildButton(root, "okada-btn-brake", "BRK", () => (this.contribution.brake = 1), () => (this.contribution.brake = 0), "right: 24px; bottom: 24px;");
    this.buildButton(root, "okada-btn-drift", "DRIFT", () => (this.contribution.drift = true), () => (this.contribution.drift = false), "right: 110px; bottom: 120px;");
    this.buildButton(root, "okada-btn-interact", "E", () => (this.contribution.interact = true), () => (this.contribution.interact = false), "right: 110px; bottom: 210px;");
    this.buildWalkStick(root);
  }

  detach(): void {
    this.contribution = {};
    this.manager.release("touch");
    const root = this.doc.getElementById("okada-phase1-controls");
    if (root) root.remove();
    const style = this.doc.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  reset(): void {
    this.contribution = {};
    this.manager.release("touch");
  }

  private injectStyles(): void {
    if (this.doc.getElementById(STYLE_ID)) return;
    const el = this.doc.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      #okada-phase1-controls { position: fixed; inset: 0; z-index: 9000; pointer-events: none; }
      #okada-phase1-controls > * { pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none; }
      .okada-btn { position: fixed; width: 64px; height: 64px; border-radius: 50%;
        background: rgba(20,30,50,0.6); color:#fff; font-weight:700; font-size:12px;
        display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.5); }
      .okada-btn.pressed { background: rgba(56,189,248,0.6); }
      #okada-steer { position: fixed; left: 20px; bottom: 24px; width: 180px; height: 120px;
        border-radius: 16px; background: rgba(20,30,50,0.35); border:2px solid rgba(255,255,255,0.3); }
      #okada-steer .knob { position:absolute; top:50%; left:50%; width:40px; height:40px; border-radius:50%;
        transform: translate(-50%,-50%); background: rgba(56,189,248,0.8); }
      #okada-walk { position: fixed; left: 24px; bottom: 24px; width: 140px; height: 140px;
        border-radius: 50%; background: rgba(20,30,50,0.35); border:2px solid rgba(255,255,255,0.3); display:none; }
      #okada-walk .knob { position:absolute; top:50%; left:50%; width:48px; height:48px; border-radius:50%;
        transform: translate(-50%,-50%); background: rgba(34,197,94,0.8); }
    `;
    this.doc.head.appendChild(el);
  }

  private ensureRoot(): HTMLElement {
    let root = this.doc.getElementById("okada-phase1-controls");
    if (!root) {
      root = this.doc.createElement("div");
      root.id = "okada-phase1-controls";
      this.doc.body.appendChild(root);
    }
    return root;
  }

  private buildSteer(root: HTMLElement): void {
    const el = this.doc.createElement("div");
    el.id = "okada-steer";
    const knob = this.doc.createElement("div");
    knob.className = "knob";
    el.appendChild(knob);
    root.appendChild(el);
    this.bindAnalog(el, knob, (dx) => {
      // dx in px, normalize to [-1,1] with a small dead zone
      const v = Math.max(-1, Math.min(1, dx / 60));
      this.contribution.steer = Math.abs(v) < 0.05 ? 0 : v;
      this.apply();
      knob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
    }, () => {
      this.contribution.steer = 0;
      knob.style.transform = "translate(-50%,-50%)";
      this.apply();
    });
  }

  private buildButton(
    root: HTMLElement,
    id: string,
    label: string,
    onPress: () => void,
    onRelease: () => void,
    css: string,
  ): void {
    const el = this.doc.createElement("button");
    el.type = "button";
    el.id = id;
    el.className = "okada-btn";
    el.textContent = label;
    el.style.cssText = css;
    root.appendChild(el);
    const down = (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.classList.add("pressed");
      onPress();
      this.apply();
    };
    const up = () => {
      el.classList.remove("pressed");
      onRelease();
      this.apply();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
  }

  private buildWalkStick(root: HTMLElement): void {
    const el = this.doc.createElement("div");
    el.id = "okada-walk";
    const knob = this.doc.createElement("div");
    knob.className = "knob";
    el.appendChild(knob);
    root.appendChild(el);
    let active = false;
    const center = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    };
    const move = (cx: number, cy: number) => {
      const c = center();
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
      if (active) return;
      e.preventDefault();
      active = true;
      el.setPointerCapture?.(e.pointerId);
      el.style.display = "flex";
      move(e.clientX, e.clientY);
    });
    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (active) move(e.clientX, e.clientY);
    });
    const end = () => {
      active = false;
      knob.style.transform = "translate(-50%,-50%)";
      this.contribution.walkX = 0;
      this.contribution.walkY = 0;
      this.apply();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }

  private bindAnalog(
    el: HTMLElement,
    knob: HTMLElement,
    onDelta: (dx: number) => void,
    onEnd: () => void,
  ): void {
    let active = false;
    let cx = 0;
    el.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      active = true;
      cx = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (active) onDelta(e.clientX - cx);
    });
    const end = () => {
      if (!active) return;
      active = false;
      onEnd();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
  }

  private apply(): void {
    this.manager.apply("touch", { ...this.contribution });
  }
}
