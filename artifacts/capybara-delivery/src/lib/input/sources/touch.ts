/**
 * Ryder Professional Mobile Touch Input Source (Phase 2C-R1).
 *
 * Implements:
 *  - 1-Axis Floating Dynamic-Origin Steering over a broad left-side zone
 *  - 2D Continuous Walking Joystick in Store (Left Thumb)
 *  - Ergonomic Right-Thumb Action Cluster (GAS, BRK, REV, DRIFT, ACTION)
 *  - Isolated Acceleration Lock feature on GAS (hold 1s to latch, tap to unlock)
 *  - Dedicated Reverse (REV) control distinct from Brake
 *  - HUD exclusion zones: steering/walk never steal touches from real UI
 *  - Robust multi-signal physical orientation detection + portrait barrier
 *  - Hardware audio/mute awareness (does NOT rewire canonical mute)
 *  - Liquid-glass studio signature: "sylens studios ™"
 *  - Repurposed menu button: SHOP ("Coming soon" Ryder shell)
 *  - Safe-Area Inset bounding (`env(safe-area-inset-*)`)
 *  - Multitouch pointer ownership and capture lifecycle
 *
 * Engine boundaries: Zero modifications to canonical engine bundle (SHA preserved)
 * and zero modifications to the frozen R3 store-motion policy or EngineAdapter.
 */
import type { OkadaInputManager } from "../input-manager";
import type { InputContribution } from "../types";

// ==========================================
// Tuning Parameters (Physical Device Tuning)
// ==========================================
//
// Steering response is exposed for physical tuning. Candidate A (shipped) is
// near-linear: low deadzone, linear response (gamma 1.0). Candidate B (mild
// precision curve, gamma 1.15-1.2) can be enabled by raising
// STEER_RESPONSE_EXPONENT, but it changes the accepted Phase-1 monotonic
// response baseline (30px => 0.5) and must be re-baselined before shipping.

/** Steering deadzone near neutral center (fraction of max throw: 0..1). */
export const STEER_DEADZONE = 0.04;
/** Steering maximum physical throw in pixels for full lock (+-1.0). */
export const STEER_MAX_THROW = 60;
/** Steering nonlinear response exponent (gamma: 1.0 = near-linear Candidate A, >1.0 = precision Candidate B). */
export const STEER_RESPONSE_EXPONENT = 1.0;

/** Store walking outer ring base diameter in pixels. */
export const WALK_BASE_DIAMETER = 140;
/** Store walking inner knob diameter in pixels. */
export const WALK_KNOB_DIAMETER = 48;
/** Store walking radial deadzone (fraction: 0..1). */
export const WALK_DEADZONE = 0.18;

/** Acceleration Lock hold duration in milliseconds to engage. */
export const GAS_LOCK_HOLD_MS = 1000;
/** Master toggle for Acceleration Lock experimental feature. */
export const GAS_LOCK_ENABLED = true;

const STYLE_ID = "okada-phase1-controls-style";
const ROOT_ID = "okada-phase1-controls-root";

type Mode = "driving" | "store";

function safeCapture(el: Element, pointerId: number): void {
  try {
    (el as HTMLElement & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(pointerId);
  } catch {
    // Synthetic/test pointer or already detached element; ownership still tracked.
  }
}

export class TouchInputSource {
  private contribution: InputContribution = {};

  // Digital button ownership: buttonId -> set of active pointer ids (Policy A multi-owner).
  public buttonOwners = new Map<string, Set<number>>();
  public capturedPointers = new Map<number, Element>();

  // Analog exclusive ownership.
  public steerOwner: number | null = null;
  public walkOwner: number | null = null;

  // Steering dynamic origin
  private steerOriginX = 0;
  private steerOriginY = 0;

  // Acceleration Lock state
  public isGasLocked = false;
  private gasHoldTimer: ReturnType<typeof setTimeout> | null = null;

  // DOM Elements
  private root: HTMLElement | null = null;
  private steerEl: HTMLElement | null = null;
  private steerKnob: HTMLElement | null = null;
  private walkEl: HTMLElement | null = null;
  private walkKnob: HTMLElement | null = null;
  private phoneBtn: HTMLElement | null = null;
  private portraitBarrier: HTMLElement | null = null;
  private shopModal: HTMLElement | null = null;

  // Mode and lifecycle state
  private mode: Mode = "driving";
  private isPhoneOpen = false;
  private isPortrait = false;
  private modeObserver: MutationObserver | null = null;
  private phoneObserver: MutationObserver | null = null;
  private menuObserver: MutationObserver | null = null;
  private attached = false;

  // Bound event handlers for clean removal
  private handleResizeBound = () => this.checkOrientation();
  private handleBlurBound = () => this.handleExternalReset("blur");
  private handleVisibilityBound = () => {
    if (this.doc.hidden) this.handleExternalReset("visibility-hidden");
  };

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
    this.buildButton(
      "okada-btn-throttle",
      "GAS",
      () => this.handleGasPress(),
      () => this.handleGasRelease(),
      "okada-btn okada-btn-gas driving-control",
      true,
    );
    this.buildButton(
      "okada-btn-brake",
      "BRK",
      () => (this.contribution.brake = 1),
      () => (this.contribution.brake = 0),
      "okada-btn okada-btn-brake driving-control",
      true,
    );
    this.buildButton(
      "okada-btn-reverse",
      "REV",
      () => (this.contribution.reverse = 1),
      () => (this.contribution.reverse = 0),
      "okada-btn okada-btn-reverse driving-control",
      true,
    );
    this.buildButton(
      "okada-btn-drift",
      "DRIFT",
      () => (this.contribution.drift = true),
      () => (this.contribution.drift = false),
      "okada-btn okada-btn-drift driving-control",
      true,
    );
    this.buildButton(
      "okada-btn-interact",
      "E",
      () => (this.contribution.interact = true),
      () => (this.contribution.interact = false),
      "okada-btn okada-btn-interact",
      false, // active in both driving and store mode
    );
    this.buildWalkStick();
    this.buildPhoneTrigger();
    this.buildPortraitBarrier();
    this.buildShopModal();
    this.setupTouchControlMarkers();
    this.enhanceStudioSignature();
    this.observeMainMenu();

    this.readMode();
    this.observeMode();
    this.observePhone();

    const win = this.doc.defaultView;
    if (win) {
      win.addEventListener("resize", this.handleResizeBound);
      win.addEventListener("orientationchange", this.handleResizeBound);
      win.addEventListener("blur", this.handleBlurBound);
    }
    this.doc.addEventListener("visibilitychange", this.handleVisibilityBound);

    this.checkOrientation();
  }

  detach(): void {
    const win = this.doc.defaultView;
    if (win) {
      win.removeEventListener("resize", this.handleResizeBound);
      win.removeEventListener("orientationchange", this.handleResizeBound);
      win.removeEventListener("blur", this.handleBlurBound);
    }
    this.doc.removeEventListener("visibilitychange", this.handleVisibilityBound);

    this.stopObservers();
    this.clearGasLock();
    this.releaseAllControls();
    this.contribution = {};
    this.manager.release("touch");

    this.shopModal?.remove();
    this.shopModal = null;
    this.root?.remove();
    this.root = null;
    const style = this.doc.getElementById(STYLE_ID);
    style?.remove();

    this.attached = false;
  }

  /** Full reset of source-owned state (blur, visibility, teardown, mode change, phone open). */
  reset(reason?: string): void {
    void reason;
    this.clearGasLock();
    this.releaseAllControls();
    this.contribution = {};
    this.manager.release("touch");
  }

  /** Called when the game enters or leaves store mode. */
  setMode(mode: Mode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.reset("mode-change");
    this.applyVisibility();
  }

  getMode(): Mode {
    return this.mode;
  }

  getGasLocked(): boolean {
    return this.isGasLocked;
  }

  clearGasLock(): void {
    if (this.gasHoldTimer) {
      clearTimeout(this.gasHoldTimer);
      this.gasHoldTimer = null;
    }
    this.isGasLocked = false;
    const gas = this.doc.getElementById("okada-btn-throttle");
    gas?.classList.remove("locked");
  }

  private handleGasPress(): void {
    if (this.isGasLocked) {
      // Tap while locked immediately clears acceleration lock.
      this.clearGasLock();
      this.contribution.throttle = 0;
      this.apply();
      return;
    }

    this.contribution.throttle = 1;
    const gas = this.doc.getElementById("okada-btn-throttle");
    gas?.classList.add("pressed");

    if (GAS_LOCK_ENABLED) {
      if (this.gasHoldTimer) clearTimeout(this.gasHoldTimer);
      this.gasHoldTimer = setTimeout(() => {
        const owners = this.buttonOwners.get("okada-btn-throttle");
        if (owners && owners.size > 0 && !this.isGasLocked) {
          this.isGasLocked = true;
          gas?.classList.add("locked");
          gas?.classList.remove("pressed");
        }
      }, GAS_LOCK_HOLD_MS);
    }
    this.apply();
  }

  private handleGasRelease(): void {
    if (this.gasHoldTimer) {
      clearTimeout(this.gasHoldTimer);
      this.gasHoldTimer = null;
    }
    const gas = this.doc.getElementById("okada-btn-throttle");
    if (this.isGasLocked) {
      // Finger released after lock engaged: throttle remains latched active.
      this.contribution.throttle = 1;
      gas?.classList.add("locked");
    } else {
      // Normal quick release: throttle returns to neutral.
      this.contribution.throttle = 0;
      gas?.classList.remove("pressed");
    }
    this.apply();
  }

  private injectStyles(): void {
    if (this.doc.getElementById(STYLE_ID)) return;
    const el = this.doc.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      :root {
        --okada-safe-top: max(env(safe-area-inset-top, 0px), 14px);
        --okada-safe-bottom: max(env(safe-area-inset-bottom, 0px), 18px);
        --okada-safe-left: max(env(safe-area-inset-left, 0px), 20px);
        --okada-safe-right: max(env(safe-area-inset-right, 0px), 20px);
      }

      #${ROOT_ID} {
        position: fixed; inset: 0;
        z-index: 100; /* Above canvas (0), below phone (200/270) and top menus */
        pointer-events: none;
        user-select: none; -webkit-user-select: none;
        -webkit-touch-callout: none; touch-action: none;
      }
      #${ROOT_ID} > * {
        pointer-events: auto;
        touch-action: none;
      }

      /* Control suppression when virtual phone or menu is open */
      #${ROOT_ID}.phone-open,
      #${ROOT_ID}.is-portrait {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      #${ROOT_ID}.phone-open > *,
      #${ROOT_ID}.is-portrait > * {
        pointer-events: none !important;
      }

      /* General Button Styling — Refined Arcade Translucent Glass */
      .okada-btn {
        position: fixed;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.65);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 800;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 1.5px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: transform 80ms ease, background-color 100ms ease, border-color 100ms ease, box-shadow 100ms ease;
      }
      .okada-btn:active,
      .okada-btn.pressed {
        transform: scale(0.92) !important;
      }

      /* Specific Right-Thumb Cluster Actions */
      #okada-btn-throttle {
        width: clamp(70px, 11.5vw, 84px);
        height: clamp(70px, 11.5vw, 84px);
        right: calc(var(--okada-safe-right) + 16px);
        bottom: calc(var(--okada-safe-bottom) + 82px);
        font-size: clamp(14px, 2.2vw, 16px);
        letter-spacing: 0.05em;
        background: rgba(15, 23, 42, 0.72);
        border: 2px solid rgba(255, 255, 255, 0.28);
      }
      #okada-btn-throttle:active,
      #okada-btn-throttle.pressed {
        background: rgba(34, 197, 94, 0.45) !important;
        border-color: rgba(74, 222, 128, 0.9) !important;
        box-shadow: 0 0 22px rgba(34, 197, 94, 0.55) !important;
      }
      #okada-btn-throttle.locked {
        background: rgba(34, 197, 94, 0.65) !important;
        border-color: rgba(34, 197, 94, 0.95) !important;
        box-shadow: 0 0 24px rgba(34, 197, 94, 0.65) !important;
        color: #f0fdf4 !important;
      }
      #okada-btn-throttle .lock-tag {
        font-size: 10px;
        font-weight: 700;
        opacity: 0;
        transition: opacity 120ms ease;
        margin-top: 2px;
      }
      #okada-btn-throttle.locked .lock-tag {
        opacity: 1;
      }

      #okada-btn-brake {
        width: clamp(56px, 9vw, 66px);
        height: clamp(56px, 9vw, 66px);
        right: calc(var(--okada-safe-right) + 16px);
        bottom: var(--okada-safe-bottom);
        font-size: clamp(12px, 1.8vw, 14px);
        background: rgba(225, 29, 72, 0.35);
        border: 1.5px solid rgba(244, 63, 94, 0.45);
      }
      #okada-btn-brake.pressed {
        background: rgba(225, 29, 72, 0.75) !important;
        border-color: rgba(244, 63, 94, 0.95) !important;
        box-shadow: 0 0 20px rgba(225, 29, 72, 0.65) !important;
      }

      #okada-btn-reverse {
        width: clamp(44px, 7vw, 52px);
        height: clamp(44px, 7vw, 52px);
        right: calc(var(--okada-safe-right) + 94px);
        bottom: var(--okada-safe-bottom);
        font-size: clamp(11px, 1.5vw, 12px);
        background: rgba(217, 119, 6, 0.35);
        border: 1.5px solid rgba(245, 158, 11, 0.45);
      }
      #okada-btn-reverse.pressed {
        background: rgba(217, 119, 6, 0.75) !important;
        border-color: rgba(245, 158, 11, 0.95) !important;
        box-shadow: 0 0 18px rgba(245, 158, 11, 0.65) !important;
      }

      #okada-btn-drift {
        width: clamp(54px, 8.5vw, 64px);
        height: clamp(54px, 8.5vw, 64px);
        right: calc(var(--okada-safe-right) + 106px);
        bottom: calc(var(--okada-safe-bottom) + 64px);
        font-size: clamp(11px, 1.6vw, 13px);
        background: rgba(147, 51, 234, 0.35);
        border: 1.5px solid rgba(168, 85, 247, 0.45);
      }
      #okada-btn-drift.pressed {
        background: rgba(147, 51, 234, 0.75) !important;
        border-color: rgba(168, 85, 247, 0.95) !important;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.65) !important;
      }

      #okada-btn-interact {
        width: clamp(56px, 9vw, 66px);
        height: clamp(56px, 9vw, 66px);
        right: calc(var(--okada-safe-right) + 106px);
        bottom: calc(var(--okada-safe-bottom) + 144px);
        font-size: clamp(13px, 2vw, 15px);
        background: rgba(16, 185, 129, 0.4);
        border: 1.5px solid rgba(52, 211, 153, 0.5);
      }
      #okada-btn-interact.pressed {
        background: rgba(16, 185, 129, 0.8) !important;
        border-color: rgba(52, 211, 153, 0.95) !important;
        box-shadow: 0 0 22px rgba(52, 211, 153, 0.65) !important;
      }
      #${ROOT_ID}.mode-store #okada-btn-interact {
        transform: scale(1.06);
        border-color: rgba(52, 211, 153, 0.9);
        box-shadow: 0 0 18px rgba(16, 185, 129, 0.45);
      }

      /* Phone Trigger in Top HUD Bar */
      #okada-btn-phone {
        position: fixed;
        width: 44px; height: 44px;
        top: var(--okada-safe-top);
        right: calc(var(--okada-safe-right) + 140px);
        border-radius: 12px;
        background: rgba(18, 22, 30, 0.7);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; color: #fff;
        cursor: pointer;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }
      #okada-btn-phone:active {
        transform: scale(0.92);
        background: rgba(56, 189, 248, 0.6);
      }

      /* Steering Control Surface (Left Thumb Floating Zone) */
      #okada-steer {
        position: fixed;
        left: 0; bottom: 0;
        width: clamp(200px, 46vw, 420px);
        height: clamp(180px, 72vh, 460px);
        background: transparent;
        touch-action: none;
        pointer-events: auto;
      }
      #okada-steer .steer-guide {
        position: absolute;
        left: calc(var(--okada-safe-left) + 24px);
        bottom: calc(var(--okada-safe-bottom) + 24px);
        width: 140px; height: 50px;
        border-radius: 25px;
        background: rgba(15, 23, 42, 0.42);
        border: 1.5px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: none;
        transition: opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        opacity: 0.55;
      }
      #okada-steer.active .steer-guide {
        opacity: 0.95;
        border-color: rgba(56, 189, 248, 0.85);
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.45);
      }
      #okada-steer .knob {
        position: absolute;
        left: calc(var(--okada-safe-left) + 94px);
        bottom: calc(var(--okada-safe-bottom) + 49px);
        width: 44px; height: 44px; border-radius: 50%;
        transform: translate(-50%, 50%);
        background: rgba(56, 189, 248, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 14px rgba(2, 132, 199, 0.6);
        pointer-events: none;
        transition: background-color 120ms ease;
      }
      #okada-steer.active .knob {
        background: rgba(56, 189, 248, 0.95);
        box-shadow: 0 0 22px rgba(56, 189, 248, 0.8);
      }

      /* Store Walking Stick (Left Thumb 2D Floating Stick) */
      #okada-walk {
        position: fixed;
        left: calc(var(--okada-safe-left) + 24px);
        bottom: calc(var(--okada-safe-bottom) + 24px);
        width: ${WALK_BASE_DIAMETER}px; height: ${WALK_BASE_DIAMETER}px;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.45);
        border: 2px solid rgba(52, 211, 153, 0.4);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        touch-action: none;
      }
      #okada-walk .knob {
        position: absolute; top: 50%; left: 50%;
        width: ${WALK_KNOB_DIAMETER}px; height: ${WALK_KNOB_DIAMETER}px; border-radius: 50%;
        transform: translate(-50%, -50%);
        background: rgba(34, 197, 94, 0.85);
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 3px 14px rgba(22, 163, 74, 0.6);
        pointer-events: none;
      }

      /* Mode Switching */
      #${ROOT_ID}.mode-store .driving-control { display: none !important; }
      #${ROOT_ID}.mode-store #okada-walk { display: block !important; }
      #${ROOT_ID}.mode-store #okada-btn-phone { display: none !important; }

      /* Suppress canonical redundant desktop touch elements */
      #mobile-controls { display: none !important; }

      /* Orientation Barrier Overlay */
      #okada-portrait-barrier {
        position: fixed; inset: 0; z-index: 10000;
        background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%);
        color: #f8fafc;
        display: none; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; padding: 28px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #okada-portrait-barrier.visible {
        display: flex !important;
      }
      .barrier-card {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        max-width: 320px;
      }
      .barrier-badge {
        font-size: 13px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
        color: #38bdf8; background: rgba(56, 189, 248, 0.12);
        padding: 4px 14px; border-radius: 999px; margin-bottom: 24px;
        border: 1px solid rgba(56, 189, 248, 0.28);
      }
      .barrier-device-wrap {
        margin-bottom: 24px;
        display: flex; align-items: center; justify-content: center;
      }
      .barrier-phone-svg {
        animation: ryderPhoneRotate 2.6s infinite ease-in-out;
        transform-origin: center center;
        filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.4));
      }
      .barrier-title {
        font-size: 22px; font-weight: 800; margin-bottom: 10px; color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .barrier-subtitle {
        font-size: 14px; color: #94a3b8; line-height: 1.5; max-width: 280px;
      }
      @keyframes ryderPhoneRotate {
        0%, 15% { transform: rotate(0deg); }
        45%, 65% { transform: rotate(-90deg); }
        85%, 100% { transform: rotate(0deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .barrier-phone-svg {
          animation: none !important;
        }
      }

      /* Suppress obsolete Vibe Jam player-facing marks */
      img[src*="award_white_on_transparent_vibejam_winner"],
      img[alt*="Vibe Jam Winner"] { display: none !important; }

      /* Canonical top-right HUD: keep it above the movement surface */
      #top-right-controls { z-index: 210 !important; }
      #top-right-controls button svg { pointer-events: none !important; }

      /* Liquid-Glass Studio Signature: sylens studios ™ */
      #sylens-badge {
        position: fixed !important;
        bottom: calc(var(--okada-safe-bottom) + 8px) !important;
        right: calc(var(--okada-safe-right) + 8px) !important;
        padding: 6px 14px !important;
        border-radius: 999px !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(15, 23, 42, 0.5) !important;
        color: rgba(248, 250, 252, 0.9) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: 0.1em !important;
        text-transform: lowercase !important;
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.35) !important;
        backdrop-filter: blur(14px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(14px) saturate(160%) !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 10000 !important;
        transition: opacity 200ms ease !important;
      }
      body.in-game #sylens-badge,
      body.in-store-mode #sylens-badge { opacity: 0 !important; }

      /* Ryder Shop Shell */
      #ryder-shop-modal {
        position: fixed; inset: 0; z-index: 99995;
        background: rgba(10, 15, 26, 0.82);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        color: #f8fafc; padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #ryder-shop-modal.visible { display: flex !important; }
      .ryder-shop-card {
        background: rgba(15, 23, 42, 0.75);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 32px 36px;
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        max-width: 380px; width: 90vw; text-align: center;
      }
      .ryder-shop-badge {
        font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
        color: #fbbf24; background: rgba(245, 158, 11, 0.15);
        padding: 4px 12px; border-radius: 999px;
        border: 1px solid rgba(245, 158, 11, 0.35);
      }
      .ryder-shop-title { font-size: 26px; font-weight: 800; letter-spacing: 0.08em; color: #f8fafc; }
      .ryder-shop-desc { font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px; }
      .ryder-shop-close {
        padding: 12px 24px; border-radius: 12px; border: none;
        background: #38bdf8; color: #0b0f19;
        font-size: 15px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 16px rgba(56, 189, 248, 0.4);
      }
    `;
    this.doc.head.appendChild(el);
  }

  private ensureRoot(): HTMLElement {
    let el = this.doc.getElementById(ROOT_ID);
    if (el && el.tagName === "DIV") return el as HTMLElement;
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

    const guide = this.doc.createElement("div");
    guide.className = "steer-guide";
    el.appendChild(guide);

    const knob = this.doc.createElement("div");
    knob.className = "knob";
    el.appendChild(knob);
    root.appendChild(el);

    this.steerEl = el;
    this.steerKnob = knob;

    el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (!this.attached || this.mode !== "driving" || this.isPhoneOpen || this.isPortrait) return;
      if (this.isHudTarget(e.target)) return; // never steal real UI touches
      if (this.steerOwner !== null) return; // exclusive ownership
      e.preventDefault();
      this.steerOwner = e.pointerId;
      this.capture(el, e.pointerId);

      // Dynamic origin established at initial touch
      this.steerOriginX = e.clientX;
      this.steerOriginY = e.clientY;
      el.classList.add("active");

      if (e.clientX > 0 && e.clientY > 0) {
        const r = el.getBoundingClientRect();
        const rx = e.clientX - r.left;
        const ry = e.clientY - r.top;
        guide.style.left = `${rx}px`;
        guide.style.top = `${ry}px`;
        guide.style.bottom = "auto";
        guide.style.transform = "translate(-50%, -50%)";
        knob.style.left = `${rx}px`;
        knob.style.top = `${ry}px`;
        knob.style.bottom = "auto";
        knob.style.transform = "translate(-50%, -50%)";
      }
    });

    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (e.pointerId !== this.steerOwner) return;

      // Pure 1-Axis horizontal displacement; vertical displacement is strictly ignored
      const dx = e.clientX - this.steerOriginX;
      const v = Math.max(-1, Math.min(1, dx / STEER_MAX_THROW));
      const mag = Math.abs(v);

      if (mag < STEER_DEADZONE) {
        this.contribution.steer = 0;
      } else if (STEER_RESPONSE_EXPONENT === 1.0) {
        this.contribution.steer = v;
      } else {
        const scaled = (mag - STEER_DEADZONE) / (1 - STEER_DEADZONE);
        const curved = Math.pow(scaled, STEER_RESPONSE_EXPONENT);
        this.contribution.steer = Math.sign(v) * curved;
      }

      knob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
      this.apply();
    });

    const endSteer = (e: PointerEvent) => {
      if (e.pointerId !== this.steerOwner) return;
      this.steerOwner = null;
      this.capturedPointers.delete(e.pointerId);
      this.contribution.steer = 0;
      el.classList.remove("active");
      guide.style.left = "";
      guide.style.top = "";
      guide.style.bottom = "";
      guide.style.transform = "";
      knob.style.left = "";
      knob.style.top = "";
      knob.style.bottom = "";
      knob.style.transform = "translate(-50%, -50%)";
      this.apply();
    };

    el.addEventListener("pointerup", endSteer);
    el.addEventListener("pointercancel", endSteer);
    el.addEventListener("lostpointercapture", endSteer);
  }

  private buildButton(
    id: string,
    label: string,
    onPress: () => void,
    onRelease: () => void,
    className: string,
    drivingOnly = true,
  ): void {
    const root = this.ensureRoot();
    const el = this.doc.createElement("button");
    el.type = "button";
    el.id = id;
    el.className = className;

    const span = this.doc.createElement("span");
    span.className = "btn-label";
    span.textContent = label;
    el.appendChild(span);

    if (id === "okada-btn-throttle") {
      const lockTag = this.doc.createElement("span");
      lockTag.className = "lock-tag";
      lockTag.textContent = "🔒 LOCK";
      el.appendChild(lockTag);
    }

    root.appendChild(el);

    let owners = this.buttonOwners.get(id);
    if (!owners) {
      owners = new Set();
      this.buttonOwners.set(id, owners);
    }

    const down = (e: PointerEvent) => {
      if (!this.attached || (drivingOnly && this.mode !== "driving") || this.isPhoneOpen || this.isPortrait) return;
      e.preventDefault();
      this.capture(el, e.pointerId);
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
      this.capturedPointers.delete(e.pointerId);
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
      if (mag < WALK_DEADZONE) {
        this.contribution.walkX = 0;
        this.contribution.walkY = 0;
      } else {
        const s = (mag - WALK_DEADZONE) / (1 - WALK_DEADZONE);
        this.contribution.walkX = (nx / mag) * s;
        this.contribution.walkY = -(ny / mag) * s; // screen up = forward
      }
      this.apply();
    };

    el.addEventListener("pointerdown", (e: PointerEvent) => {
      if (!this.attached || this.mode !== "store" || this.isPhoneOpen || this.isPortrait) return;
      if (this.isHudTarget(e.target)) return; // never steal real UI touches
      if (this.walkOwner !== null) return; // exclusive owner
      e.preventDefault();
      this.walkOwner = e.pointerId;
      this.capture(el, e.pointerId);
      move(e.clientX, e.clientY);
    });

    el.addEventListener("pointermove", (e: PointerEvent) => {
      if (e.pointerId !== this.walkOwner) return;
      move(e.clientX, e.clientY);
    });

    const endWalk = (e: PointerEvent) => {
      if (e.pointerId !== this.walkOwner) return;
      this.walkOwner = null;
      this.capturedPointers.delete(e.pointerId);
      this.contribution.walkX = 0;
      this.contribution.walkY = 0;
      knob.style.transform = "translate(-50%, -50%)";
      this.apply();
    };

    el.addEventListener("pointerup", endWalk);
    el.addEventListener("pointercancel", endWalk);
    el.addEventListener("lostpointercapture", endWalk);
  }

  private buildPhoneTrigger(): void {
    const root = this.ensureRoot();
    const btn = this.doc.createElement("button");
    btn.type = "button";
    btn.id = "okada-btn-phone";
    btn.className = "driving-control";
    btn.title = "Toggle Phone";
    btn.innerHTML = "📱";

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleVirtualPhone();
    });

    root.appendChild(btn);
    this.phoneBtn = btn;
  }

  private toggleVirtualPhone(): void {
    const win = this.doc.defaultView as unknown as { __capyGame?: { phone?: { toggle: () => void; show: () => void; hide: () => void; visible?: boolean } } };
    const phone = win?.__capyGame?.phone;
    if (phone && typeof phone.hide === "function" && typeof phone.show === "function") {
      if (this.isPhoneOpen || phone.visible) {
        phone.hide();
      } else {
        phone.show();
      }
    } else if (phone?.toggle) {
      phone.toggle();
    }
    // No synthetic keyboard fallback: never emit keyboard events.
    setTimeout(() => this.checkPhone(), 60);
  }

  private buildPortraitBarrier(): void {
    if (this.doc.getElementById("okada-portrait-barrier")) return;
    const barrier = this.doc.createElement("div");
    barrier.id = "okada-portrait-barrier";
    barrier.innerHTML = `
      <div class="barrier-card">
        <div class="barrier-badge">RYDER</div>
        <div class="barrier-device-wrap">
          <svg class="barrier-phone-svg" viewBox="0 0 64 96" width="64" height="96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="52" height="88" rx="10" stroke="#38bdf8" fill="rgba(15, 23, 42, 0.75)" />
            <line x1="26" y1="12" x2="38" y2="12" stroke="#94a3b8" stroke-width="2" />
            <circle cx="32" cy="80" r="3" fill="#94a3b8" stroke="none" />
            <path d="M 48 30 C 58 40, 58 56, 48 66" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="2 3" />
            <polyline points="50,60 48,66 42,65" stroke="#fbbf24" stroke-width="2.5" fill="none" />
          </svg>
        </div>
        <div class="barrier-title">Rotate your phone to play</div>
        <div class="barrier-subtitle">Ryder is designed for mobile landscape. Turn your device horizontally to ride.</div>
      </div>
    `;
    this.doc.body.appendChild(barrier);
    this.portraitBarrier = barrier;
  }

  private checkOrientation(): void {
    const win = this.doc.defaultView;
    if (!win) return;

    // Multi-signal physical orientation: never trust a single API.
    const winW = win.innerWidth;
    const winH = win.innerHeight;
    let topW = winW;
    let topH = winH;
    try {
      if (win.top && win.top !== win) {
        topW = win.top.innerWidth;
        topH = win.top.innerHeight;
      }
    } catch {
      // Cross-origin parent window guard.
    }

    const matchPortrait = !!win.matchMedia?.("(orientation: portrait)")?.matches;
    const screenType = win.screen?.orientation?.type;
    const screenLandscape = typeof screenType === "string" && screenType.includes("landscape");
    const screenPortrait = typeof screenType === "string" && screenType.includes("portrait");

    let isPortrait: boolean;
    if (screenLandscape) isPortrait = false;
    else if (screenPortrait) isPortrait = true;
    else isPortrait = winH > winW || topH > topW || matchPortrait;

    if (isPortrait === this.isPortrait) return;

    this.isPortrait = isPortrait;
    if (isPortrait) {
      this.reset("portrait-mode");
      this.portraitBarrier?.classList.add("visible");
      this.root?.classList.add("is-portrait");
    } else {
      this.portraitBarrier?.classList.remove("visible");
      this.root?.classList.remove("is-portrait");
      this.reset("landscape-restore");
    }
    this.checkPhone();
  }

  private readMode(): void {
    const store = !!this.doc.body?.classList?.contains("in-store-mode");
    this.setMode(store ? "store" : "driving");
  }

  private observeMode(): void {
    if (!this.doc.body) return;
    this.modeObserver = new MutationObserver(() => this.readMode());
    this.modeObserver.observe(this.doc.body, { attributes: true, attributeFilter: ["class"] });
  }

  private checkPhone(): void {
    const phoneHud = this.doc.getElementById("phone-hud");
    const win = this.doc.defaultView as unknown as { __capyGame?: { phone?: { visible?: boolean } } };
    const isOpen = !!(
      win?.__capyGame?.phone?.visible ||
      (phoneHud && phoneHud.classList.contains("phone-visible") && this.doc.defaultView?.getComputedStyle(phoneHud).display !== "none")
    );

    if (isOpen !== this.isPhoneOpen) {
      this.isPhoneOpen = isOpen;
      if (isOpen) {
        this.reset("phone-opened");
        this.root?.classList.add("phone-open");
      } else {
        this.root?.classList.remove("phone-open");
        this.reset("phone-closed");
      }
    }
  }

  private observePhone(): void {
    this.checkPhone();
    this.phoneObserver = new MutationObserver(() => this.checkPhone());
    this.phoneObserver.observe(this.doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  private stopObservers(): void {
    this.modeObserver?.disconnect();
    this.modeObserver = null;
    this.phoneObserver?.disconnect();
    this.phoneObserver = null;
    this.menuObserver?.disconnect();
    this.menuObserver = null;
  }

  /** True when a pointer landed on real canonical/HUD UI rather than the play area. */
  private isHudTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el?.closest?.(
      "#top-right-controls, #okada-btn-phone, #phone-hud, #mission-prompt, #mission-result, " +
        ".capy-mbtn, #mp-main-menu, #ryder-shop-modal, #okada-portrait-barrier",
    );
  }

  private setupTouchControlMarkers(): void {
    const mute = this.doc.getElementById("btn-mute");
    mute?.setAttribute("data-touch-control", "true");
    const topRight = this.doc.getElementById("top-right-controls");
    if (topRight) {
      for (const btn of Array.from(topRight.querySelectorAll("button"))) {
        btn.setAttribute("data-touch-control", "true");
      }
    }
    // The canonical bundle already owns the #btn-mute click listener. Do NOT add
    // a second mute handler here; a duplicate toggle makes mute appear to do nothing.
  }

  private enhanceStudioSignature(): void {
    const badge = this.doc.getElementById("sylens-badge");
    if (!badge) return;
    if (badge.textContent !== "sylens studios ™") badge.textContent = "sylens studios ™";
    if (badge.className !== "sylens-liquid-glass") badge.className = "sylens-liquid-glass";
  }

  private buildShopModal(): void {
    if (this.doc.getElementById("ryder-shop-modal")) return;
    const modal = this.doc.createElement("div");
    modal.id = "ryder-shop-modal";
    modal.innerHTML = `
      <div class="ryder-shop-card">
        <div class="ryder-shop-badge">COMING SOON</div>
        <div class="ryder-shop-title">RYDER SHOP</div>
        <div class="ryder-shop-desc">
          Custom delivery bikes, courier helmets, and performance gear are being engineered for Lekkiwood.
        </div>
        <button type="button" class="ryder-shop-close" id="ryder-shop-close">CLOSE</button>
      </div>
    `;
    modal.querySelector("#ryder-shop-close")?.addEventListener("click", () => {
      modal.classList.remove("visible");
    });
    this.doc.body.appendChild(modal);
    this.shopModal = modal;
  }

  private observeMainMenu(): void {
    const scanMenu = () => {
      this.enhanceStudioSignature();
      const buttons = Array.from(this.doc.querySelectorAll(".capy-mbtn"));
      for (const btn of buttons) {
        if (btn.classList.contains("ryder-shop-repurposed")) continue;
        const txt = (btn.textContent || "").toLowerCase();
        if (txt.includes("portal") || txt.includes("vibe")) {
          btn.textContent = "SHOP";
          btn.classList.add("ryder-shop-repurposed");
          // Intercept in capture phase so the canonical click redirect never fires.
          btn.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              this.shopModal?.classList.add("visible");
            },
            true,
          );
          btn.addEventListener("pointerdown", (e) => e.stopPropagation(), true);
        }
      }
    };

    scanMenu();
    this.menuObserver = new MutationObserver(scanMenu);
    this.menuObserver.observe(this.doc.body, { childList: true, subtree: true });
  }

  private handleExternalReset(reason: string): void {
    this.reset(reason);
  }

  private capture(el: Element, pointerId: number): void {
    safeCapture(el, pointerId);
    this.capturedPointers.set(pointerId, el);
  }

  private releaseAllControls(): void {
    const captures = Array.from(this.capturedPointers);
    this.capturedPointers.clear();
    this.buttonOwners.forEach((owners) => owners.clear());

    for (const el of Array.from(this.doc.querySelectorAll(".okada-btn.pressed"))) {
      el.classList.remove("pressed");
    }

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

    for (const [pointerId, el] of captures) {
      try {
        if (el.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
      } catch {
        // Pointer already released or detached.
      }
    }
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
