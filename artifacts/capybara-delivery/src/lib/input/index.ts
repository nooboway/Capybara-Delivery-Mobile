/**
 * Okada input system entry point.
 *
 * Initializes the normalized input foundation for a game iframe:
 *
 *   touch/gamepad/tilt  →  OkadaInputManager  →  OkadaEngineAdapter  →  rC  →  engine
 *
 * The engine's native keyboard path is left intact and used as the adapter's
 * fallback whenever no normalized source is active.
 *
 * Phase 1C additions:
 *  - centralized `reset(reason)` that resets every source AND the manager;
 *  - AbortSignal support so stale async initialization cannot win an
 *    iframe/document generation;
 *  - dispose() restores the engine adapter's original getter descriptors.
 *
 * This module is framework-agnostic (no React dependency).
 */
import { installRyderStoreMotionPolicy, type StoreMotionTarget } from "../ryder-store-motion-policy";
import { OkadaInputManager } from "./input-manager";
import { OkadaEngineAdapter } from "./engine-adapter";
import { TouchInputSource } from "./sources/touch";
import { GamepadInputSource } from "./sources/gamepad";

export interface OkadaInputHandle {
  manager: OkadaInputManager;
  adapter: OkadaEngineAdapter;
  touch: TouchInputSource;
  gamepad: GamepadInputSource;
  /** Reset every source and the manager to neutral (blur/visibility/teardown). */
  reset(reason?: string): void;
  /** Remove all injected DOM, restore the adapter, and release all input. */
  dispose(): void;
}

export interface OkadaInputOptions {
  /** Attach Phase-1 touch controls (default true). */
  touchControls?: boolean;
  /** Start gamepad polling (stub in Phase 1). */
  gamepad?: boolean;
  /** Abort signal to cancel delayed initialization (iframe lifecycle). */
  signal?: AbortSignal;
}

const generations = new WeakMap<Window, { dispose?: () => void }>();
const RESOLVE_POLL_MS = 250;

/**
 * Initialize the Okada input system against a game iframe.
 * Waits for normal engine startup; returns null if this generation is cancelled.
 */
export async function initOkadaInput(
  win: Window,
  doc: Document,
  options: OkadaInputOptions = {},
): Promise<OkadaInputHandle | null> {
  generations.get(win)?.dispose?.();
  const generation: { dispose?: () => void } = {};
  generations.set(win, generation);
  const manager = new OkadaInputManager();
  const adapter = new OkadaEngineAdapter();
  const touch = new TouchInputSource(doc, manager);
  const gamepad = new GamepadInputSource(manager);
  const pending = new AbortController();
  let pendingDisposed = false;
  const removePendingListeners = () => {
    win.removeEventListener("pagehide", disposePending);
    options.signal?.removeEventListener("abort", disposePending);
  };
  const disposePending = () => {
    if (pendingDisposed) return;
    pendingDisposed = true;
    pending.abort();
    removePendingListeners();
    touch.detach();
    gamepad.stop();
  };
  generation.dispose = disposePending;
  win.addEventListener("pagehide", disposePending);
  options.signal?.addEventListener("abort", disposePending, { once: true });

  // Attach the HUD/controls immediately so the menu (SHOP), orientation barrier,
  // shop shell and studio signature exist before the engine input object resolves.
  if (options.touchControls !== false) {
    touch.attach();
  }

  if (options.signal?.aborted) disposePending();
  const resolved = await waitForInput(win, adapter, pending.signal);
  removePendingListeners();
  if (!resolved || options.signal?.aborted || generations.get(win) !== generation) {
    disposePending();
    return null;
  }

  // A menu gesture must not become held driving input when startup finishes.
  touch.reset("engine-ready");
  adapter.override(manager);
  const game = (win as unknown as { __capyGame?: { store?: StoreMotionTarget } }).__capyGame;
  const motionPolicy = game?.store ? installRyderStoreMotionPolicy(game.store) : null;

  if (options.gamepad) {
    gamepad.start();
  }

  let disposed = false;
  const resetAll = (reason?: string) => {
    if (disposed) return;
    touch.reset(reason);
    gamepad.reset(reason);
    manager.reset();
  };

  // Centralized release safety.
  const onBlur = () => resetAll("blur");
  const onVisibility = () => {
    if (doc.hidden) resetAll("visibility");
  };
  win.addEventListener("blur", onBlur);
  doc.addEventListener("visibilitychange", onVisibility);

  // Debug handle for automated verification (Phase 1).
  (win as unknown as Record<string, unknown>)["__okadaInput"] = {
    manager,
    adapter,
    touch,
    gamepad,
    state: () => manager.getState(),
  };

  const handle: OkadaInputHandle = {
    manager,
    adapter,
    touch,
    gamepad,
    reset: resetAll,
    dispose() {
      if (disposed) return;
      disposed = true;
      touch.detach();
      gamepad.stop();
      manager.reset();
      adapter.restore();
      motionPolicy?.dispose();
      win.removeEventListener("pagehide", handle.dispose);
      options.signal?.removeEventListener("abort", handle.dispose);
      if (generations.get(win) === generation) generations.delete(win);
      win.removeEventListener("blur", onBlur);
      doc.removeEventListener("visibilitychange", onVisibility);
      delete (win as unknown as Record<string, unknown>)["__okadaInput"];
    },
  };
  generation.dispose = handle.dispose;
  win.addEventListener("pagehide", handle.dispose);
  options.signal?.addEventListener("abort", handle.dispose, { once: true });
  return handle;
}

async function waitForInput(
  win: Window,
  adapter: OkadaEngineAdapter,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (ready: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      resolve(ready);
    };
    const cancel = () => finish(false);
    const tick = () => {
      if (signal.aborted) {
        finish(false);
        return;
      }
      if (adapter.resolve(win)) {
        finish(true);
        return;
      }
      timer = setTimeout(tick, RESOLVE_POLL_MS);
    };
    signal.addEventListener("abort", cancel, { once: true });
    tick();
  });
}

export { OkadaInputManager } from "./input-manager";
export { OkadaEngineAdapter } from "./engine-adapter";
export { TouchInputSource } from "./sources/touch";
export { GamepadInputSource } from "./sources/gamepad";
export * from "./types";
