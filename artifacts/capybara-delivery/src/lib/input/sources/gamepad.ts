/**
 * Gamepad input source (Phase 1 stub — no production gamepad UX yet).
 *
 * The engine has no Gamepad API usage; gamepads will be polled here and mapped
 * into the same normalized state as touch, so gameplay code never changes.
 * Implementation lands in Phase 2.
 */
import type { OkadaInputManager } from "../input-manager";

export class GamepadInputSource {
  private running = false;

  constructor(private manager: OkadaInputManager) {}

  start(): void {
    // Placeholder: poll navigator.getGamepads() and manager.apply("gamepad", {...}).
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.manager.release("gamepad");
  }

  isRunning(): boolean {
    return this.running;
  }
}
