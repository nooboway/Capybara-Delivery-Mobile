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

const RESOLVE_TIMEOUT_MS = 60000;
const RESOLVE_POLL_MS = 250;

/**
 * Initialize the Okada input system against a game iframe.
 * Returns null if the engine input object could not be resolved (or was aborted).
 */
export async function initOkadaInput(
  win: Window,
  doc: Document,
  options: OkadaInputOptions = {},
): Promise<OkadaInputHandle | null> {
  const manager = new OkadaInputManager();
  const adapter = new OkadaEngineAdapter();
  const touch = new TouchInputSource(doc, manager);
  const gamepad = new GamepadInputSource(manager);

  const resolved = await waitForInput(win, adapter, RESOLVE_TIMEOUT_MS, options.signal);
  if (!resolved) {
    // eslint-disable-next-line no-console
    console.error("[okada] engine input object not resolved; normalized input unavailable");
    return null;
  }

  adapter.override(manager);

  if (options.touchControls !== false) {
    touch.attach();
  }
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

  return {
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
      win.removeEventListener("blur", onBlur);
      doc.removeEventListener("visibilitychange", onVisibility);
      delete (win as unknown as Record<string, unknown>)["__okadaInput"];
    },
  };
}

async function waitForInput(
  win: Window,
  adapter: OkadaEngineAdapter,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (signal?.aborted) {
        resolve(false);
        return;
      }
      if (adapter.resolve(win)) {
        resolve(true);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, RESOLVE_POLL_MS);
    };
    tick();
  });
}

export { OkadaInputManager } from "./input-manager";
export { OkadaEngineAdapter } from "./engine-adapter";
export { TouchInputSource } from "./sources/touch";
export { GamepadInputSource } from "./sources/gamepad";
export * from "./types";
