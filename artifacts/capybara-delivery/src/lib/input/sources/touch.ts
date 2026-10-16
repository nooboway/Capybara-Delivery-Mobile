/** Compatibility export for the approved input-source API.
 * All active mobile presentation, geometry and pointer ownership now belong to
 * RyderMobileControls; the retired hybrid implementation is no longer shipped.
 */
export { RyderMobileControls as TouchInputSource, GAS_LOCK_ENABLED, GAS_LOCK_HOLD_MS, BRAKE_REVERSE_ENTER_SPEED, BRAKE_REENTER_SPEED, BRAKE_REVERSE_POLL_MS, STICK_IDLE_OPACITY, STICK_ACTIVE_OPACITY } from '../mobile/ryder-mobile-controls';
export { STEER_DEADZONE, STEER_MAX_THROW, STEER_RESPONSE_EXPONENT, WALK_DEADZONE, WALK_MAX_RADIUS } from '../mobile/floating-joystick';
