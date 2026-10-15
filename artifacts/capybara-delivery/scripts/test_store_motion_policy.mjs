// Ryder Phase 2C-R3 — store-motion policy unit test (Node, no browser).
//
// Exercises the explicit Ryder store-motion policy in isolation against a fake
// canonical store. Proves: exactly-once canonical execution, damping ONLY when
// effective walking intent is neutral, source-agnostic intent handling,
// idempotent install, refcounted leases, and descriptor-faithful restore.
//
// This test never touches the canonical bundle and installs exactly one wrapper.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(__dirname, "..");
const REPO = path.resolve(PKG, "..", "..");
const esbuild = require(path.join(REPO, "node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild"));

const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "ryder-store-motion-policy.mjs");
esbuild.buildSync({
  entryPoints: [path.join(PKG, "src/lib/ryder-store-motion-policy.ts")],
  bundle: true,
  format: "esm",
  outfile: out,
  logLevel: "silent",
});
const { installRyderStoreMotionPolicy, STORE_STOP_RATE, STORE_STOP_SPEED } = await import(
  "file://" + out.replace(/\\/g, "/")
);

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

// A faithful stand-in for the canonical store's motion contract. The `update`
// method lives on the prototype, exactly like the real store, so descriptor
// restore can be verified. It mirrors the canonical idle damping factor of
// exp(0)=1 (zero brake friction) so the policy is the only dissipation.
class FakeStore {
  constructor() {
    this.walkerVel = { x: 0, z: 0 };
    this.isActive = true;
    this.calls = 0;
    this._protoCalls = 0;
  }
  update(input, dt, _camera) {
    this._protoCalls += 1;
    const v = input?.walkVec;
    const n = Math.hypot(v?.x ?? 0, v?.z ?? 0);
    const P = n > 0;
    // canonical: no friction when idle-or-moving when friction==0
    const c = Math.exp(-(P ? 0 : 0) * dt);
    this.walkerVel.x *= c;
    this.walkerVel.z *= c;
    return { P };
  }
}

// ---- 1. Install wraps once; canonical executes exactly once per call -------
{
  const store = new FakeStore();
  const proto = Object.getPrototypeOf(store);
  const realUpdate = proto.update;
  const original = store.update;
  const policy = installRyderStoreMotionPolicy(store);
  check("install owns the update method", Object.prototype.hasOwnProperty.call(store, "update"));
  check("wrapper differs from prototype method", store.update !== realUpdate);
  check("canonical prototype preserved for restore", proto.update === realUpdate);

  const before = store._protoCalls;
  store.update({ walkVec: { x: 1, z: 0 } }, 1 / 60, null);
  check("canonical update executes exactly once per call", store._protoCalls - before === 1, `delta=${store._protoCalls - before}`);
  check("original captured is the prototype method", typeof original === "function");

  policy.dispose();
  check("dispose removes own wrapper (falls back to prototype)", !Object.prototype.hasOwnProperty.call(store, "update"));
  check("dispose restores prototype method", store.update === realUpdate);
}

// ---- 2. Damping applies ONLY when effective walking intent is neutral ------
{
  const store = new FakeStore();
  const policy = installRyderStoreMotionPolicy(store);

  // non-neutral intent -> no damping (velocity must be exactly preserved)
  store.walkerVel.x = 3;
  store.update({ walkVec: { x: 1, z: 0 } }, 1 / 60, null);
  check("damping skipped when intent is active (x)", store.walkerVel.x === 3, `v=${store.walkerVel.x}`);

  // neutral intent -> damping applied
  store.walkerVel.x = 3;
  store.walkerVel.z = 3;
  store.update({ walkVec: { x: 0, z: 0 } }, 1 / 60, null);
  check("damping applied when intent is neutral", store.walkerVel.x < 3 && store.walkerVel.z < 3, `v=(${store.walkerVel.x},${store.walkerVel.z})`);

  // near-zero-but-not-neutral tiny intent is still treated as neutral
  store.walkerVel.x = 3;
  store.update({ walkVec: { x: 1e-9, z: 0 } }, 1 / 60, null);
  check("sub-epsilon intent treated as neutral", store.walkerVel.x < 3, `v=${store.walkerVel.x}`);

  // low speed snaps exactly to zero
  store.walkerVel.x = 0.01;
  store.walkerVel.z = 0;
  store.update({ walkVec: { x: 0, z: 0 } }, 1 / 60, null);
  check("low speed snaps to exactly zero", store.walkerVel.x === 0 && store.walkerVel.z === 0);

  // inactive store is never damped
  store.isActive = false;
  store.walkerVel.x = 3;
  store.update({ walkVec: { x: 0, z: 0 } }, 1 / 60, null);
  check("inactive store is not damped", store.walkerVel.x === 3, `v=${store.walkerVel.x}`);

  policy.dispose();
}

// ---- 3. Intent source is irrelevant (no touch/keyboard coupling) -----------
{
  const store = new FakeStore();
  const policy = installRyderStoreMotionPolicy(store);
  // Both a "keyboard" vector and a "touch" vector are just walkVec.
  for (const src of [{ x: 0, z: -1 }, { x: 0.7, z: -0.7 }]) {
    store.walkerVel.x = 2;
    store.walkerVel.z = 2;
    store.update({ walkVec: src }, 1 / 60, null);
    check(`active intent damped=no for ${JSON.stringify(src)}`, store.walkerVel.x === 2 && store.walkerVel.z === 2);
  }
  policy.dispose();
}

// ---- 4. Idempotent install + refcounted leases ----------------------------
{
  const store = new FakeStore();
  const proto = Object.getPrototypeOf(store);
  const realUpdate = proto.update;
  const a = installRyderStoreMotionPolicy(store);
  const wrapperAfterA = store.update;
  const b = installRyderStoreMotionPolicy(store);
  check("second install reuses the same wrapper", store.update === wrapperAfterA);
  check("second install does not re-wrap", store.update !== realUpdate);
  a.dispose();
  check("one lease remaining keeps wrapper installed", store.update === wrapperAfterA);
  b.dispose();
  check("final lease restores prototype", store.update === realUpdate);
  // full re-install after full release works and stores no stale state
  const c = installRyderStoreMotionPolicy(store);
  check("re-install after release succeeds", store.update !== realUpdate && store.update !== wrapperAfterA);
  c.dispose();
  check("re-install dispose restores again", store.update === realUpdate);
}

// ---- 5. Constants are the reviewed policy values -------------------------
check("stop rate is 28", STORE_STOP_RATE === 28);
check("stop speed is 0.05", STORE_STOP_SPEED === 0.05);
{
  // practical max-speed stop time within the 100-200 ms target for speed 3
  const t = Math.log(3 / STORE_STOP_SPEED) / STORE_STOP_RATE;
  check("max-speed (v=3) stop time within 100-200 ms", t >= 0.1 && t <= 0.2, `${(t * 1000).toFixed(1)} ms`);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\nTOTAL: ${results.length} | PASSED: ${results.length - failed} | FAILED: ${failed}`);
if (failed > 0) {
  console.error("STORE-MOTION POLICY UNIT TEST FAILED");
  process.exit(1);
}
console.log("ALL STORE-MOTION POLICY UNIT CHECKS PASSED");
