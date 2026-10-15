/** Explicit Ryder-only adaptation of canonical store inertia. */
export const STORE_STOP_RATE = 28;
export const STORE_STOP_SPEED = 0.05;
const INTENT_EPSILON = 1e-6;
type WalkingInput = { walkVec?: { x: number; z: number } };
export interface StoreMotionTarget {
  update: (input: WalkingInput, dt: number, camera: unknown) => unknown;
  walkerVel: { x: number; z: number };
  readonly isActive: boolean;
}
export interface StoreMotionPolicy {
  readonly rate: number;
  readonly snapSpeed: number;
  dispose(): void;
}
type Installation = { wrapper: StoreMotionTarget["update"]; release: () => void; refs: number };
const installations = new WeakMap<StoreMotionTarget, Installation>();

/** One wrapper per store; independent leases make repeated install/dispose safe. */
export function installRyderStoreMotionPolicy(store: StoreMotionTarget): StoreMotionPolicy {
  let installation = installations.get(store);
  if (!installation) {
    const original = store.update; // Preserve exact identity, including inherited methods.
    const descriptor = Object.getOwnPropertyDescriptor(store, "update");
    const wrapper: StoreMotionTarget["update"] = function (this: StoreMotionTarget, input, dt, camera) {
      const intent = input?.walkVec;
      const neutral = !!intent && Number.isFinite(intent.x) && Number.isFinite(intent.z)
        && Math.abs(intent.x) <= INTENT_EPSILON && Math.abs(intent.z) <= INTENT_EPSILON;
      const result = original.call(this, input, dt, camera);
      if (this === store && store.isActive && neutral && Number.isFinite(dt) && dt > 0) {
        const velocity = store.walkerVel;
        const decay = Math.exp(-STORE_STOP_RATE * dt);
        velocity.x *= decay;
        velocity.z *= decay;
        if (Math.hypot(velocity.x, velocity.z) <= STORE_STOP_SPEED) {
          velocity.x = 0;
          velocity.z = 0;
        }
      }
      return result;
    };
    store.update = wrapper;
    installation = {
      wrapper, refs: 0,
      release() {
        if (store.update === wrapper) {
          if (descriptor) Object.defineProperty(store, "update", descriptor);
          else delete (store as Partial<StoreMotionTarget>).update;
        }
        installations.delete(store);
      },
    };
    installations.set(store, installation);
  } else if (store.update !== installation.wrapper) {
    throw new Error("Ryder store policy replaced while installed; dispose owners before reinstalling");
  }
  installation.refs++;
  const owned = installation;
  let disposed = false;
  return {
    rate: STORE_STOP_RATE, snapSpeed: STORE_STOP_SPEED,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (--owned.refs === 0) owned.release();
    },
  };
}
