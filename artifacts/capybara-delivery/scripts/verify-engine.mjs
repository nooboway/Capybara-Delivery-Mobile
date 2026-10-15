// Automated Phase-1 verification (normal startup and canonical store acceptance).
import { verifyStoreInteractions } from "./verify-store-interaction.mjs";
// Layers:
//   A — canonical engine integrity (hash, size, parse)
//   B — manager/adapter mapping + keyboard fallback + interlock + descriptor restore
//   C — touch source event tests (root, ownership, multitouch, reset, mode visibility, analog walk)
//   D — lifecycle (abort/dispose/restore idempotency)
//   E — actual canonical store interactions after normal menu startup
// Bundles the REAL src/lib/input modules with esbuild and runs them in a headless browser.
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(__dirname, "..");
const REPO = path.resolve(PKG, "..", "..");
const BUNDLE = path.join(PKG, "public", "assets", "main-CSpZwCDB.js");
const CANONICAL_SHA = "C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E";
const CANONICAL_SIZE = 6588195;

const acorn = require(path.join(REPO, "node_modules/.pnpm/acorn@8.18.0/node_modules/acorn"));
const esbuild = require(path.join(REPO, "node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild"));
const pw = require("C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");
const http = require("node:http");

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  [${currentLayer}] ${name}${detail ? "  (" + detail + ")" : ""}`);
}
let currentLayer = "A";

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT: " + label)), ms)),
  ]);
}

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex").toUpperCase(); }

// ============ LAYER A ============
currentLayer = "A";
const raw = fs.readFileSync(BUNDLE);
check("canonical SHA-256", sha256(raw) === CANONICAL_SHA, sha256(raw));
check("canonical size", raw.length === CANONICAL_SIZE, String(raw.length));
try { acorn.parse(raw.toString("utf8"), { ecmaVersion: "latest", sourceType: "module" }); check("parse acorn", true); }
catch (e) { check("parse acorn", false, e.message); }
try { esbuild.transformSync(raw.toString("utf8"), { loader: "js", format: "esm", logLevel: "silent" }); check("parse esbuild", true); }
catch (e) { check("parse esbuild", false, String(e)); }

// bundle the real input modules
const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "okada-input.js");
esbuild.buildSync({
  entryPoints: [path.join(PKG, "src/lib/input/index.ts")],
  bundle: true,
  format: "iife",
  globalName: "OkadaInput",
  outfile: out,
  logLevel: "silent",
});
const inputJs = fs.readFileSync(out, "utf8");
check("bundle input modules", inputJs.length > 0, inputJs.length + " bytes");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".bin": "application/octet-stream" };
function serve(port) { return new Promise((res) => { const s = http.createServer((req, r) => { let u = decodeURIComponent((req.url || "/").split("?")[0]); if (u === "/") u = "/capybara-game/index.html"; const root = path.resolve(path.join(PKG, "public")); const fp = path.resolve(root, "." + u); if (!fp.startsWith(root + path.sep)) { r.writeHead(403); r.end(); return; } fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" }); r.end(d); }); }); s.listen(port, "127.0.0.1", () => res(s)); }); }

const pageEval = `(${(() => {
  function dispatch(el, type, init) {
    el.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch", isPrimary: true, clientX: 0, clientY: 0 }, init)));
  }
  return { dispatch };
}).toString()})()`;

async function main() {
  await serve(4203);
  const browser = await pw.chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  page.setDefaultTimeout(180000);
  page.on("pageerror", (e) => console.log("[pageerror]", String(e)));
  page.on("requestfailed", (request) => console.log("[requestfailed]", request.url(), request.failure()?.errorText));
  page.on("console", (message) => { if (message.type() === "error") console.log("[console error]", message.text()); });
  await page.goto("http://127.0.0.1:4203/capybara-game/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  // Direct game.start() leaves the application's awaitClick/menu startup pending.
  // Consume that UI normally before installing or pressing any Okada control.
  await page.waitForFunction(() => document.querySelector('[data-role="click"]'), null, { timeout: 180000 });
  await page.evaluate(() => {
    // Reduce software-rendering cost without changing gameplay configuration.
    window.__capyGame.renderer.setPixelRatio(0.25);
    window.__capyGame._applyRenderSize();
  });
  const startRect = await page.locator('[data-role="click"]').boundingBox();
  await page.touchscreen.tap(startRect.x + startRect.width / 2, startRect.y + startRect.height / 2);
  await page.getByRole('button', { name: /play offline/i }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await page.evaluate(() => window.__capyGame.tutorial?.complete());
  console.log('NORMAL_STARTUP', await page.evaluate(() => ({
    mode: window.__capyGame.mode,
    menu: window.__capyGame._menuRendering,
    launched: window.__capyGame._launched,
  })));

  currentLayer = "A";
  const boot = await page.evaluate(() => ({
    capyGame: typeof window.__capyGame !== "undefined",
    capyAudio: typeof window.__capyAudio !== "undefined",
    three: typeof window.__THREE__ !== "undefined",
  }));
  check("boot __capyGame", boot.capyGame);
  check("boot __capyAudio", boot.capyAudio);
  check("boot __THREE__", boot.three);

  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });

  // ============ LAYER B: manager/adapter mapping ============
  currentLayer = "B";
  const b = await frame.evaluate(async () => {
    const h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: false, gamepad: false });
    const rC = h.adapter.getEngineInput();
    const m = h.manager;
    const out = {};
    // steering fractional
    const vals = [-1, -0.5, 0, 0.35, 1];
    out.steer = {};
    for (const v of vals) { m.apply("touch", { steer: v }); out.steer[String(v)] = rC.steerDir; }
    m.reset();
    // brake/reverse/throttle
    m.apply("touch", { brake: 1 }); out.brake = { brake: rC.brake, backward: rC.backward, forward: rC.forward };
    m.apply("touch", { reverse: 1 }); out.reverse = { brake: rC.brake, backward: rC.backward };
    m.apply("touch", { throttle: 1 }); out.throttle = { forward: rC.forward };
    m.reset();
    // walk vector
    m.apply("touch", { walkX: 0.42, walkY: -0.71 }); out.walk = rC.walkVec;
    m.reset();
    // keyboard fallback: no normalized -> original getter (reads native keyboard)
    out.fallbackNeutral = rC.steerDir;
    return { out, rC, m, h };
  });
  const steerOk = Object.entries(b.out.steer).every(([k, v]) => Math.abs(Number(k) - Number(v)) < 1e-9);
  check("steering fractional readback", steerOk, JSON.stringify(b.out.steer));
  check("brake independent", b.out.brake.brake === true && b.out.brake.backward === false && b.out.brake.forward === false, JSON.stringify(b.out.brake));
  check("reverse distinct", b.out.reverse.backward === true && b.out.reverse.brake === false, JSON.stringify(b.out.reverse));
  check("throttle forward", b.out.throttle.forward === true, JSON.stringify(b.out.throttle));
  check("walk non-cardinal vector", b.out.walk && b.out.walk.active && Math.abs(b.out.walk.x - 0.42) < 1e-9 && Math.abs(b.out.walk.z - 0.71) < 1e-9, JSON.stringify(b.out.walk));

  // interlock: tutorial-locked suppresses normalized input
  const interlock = await frame.evaluate(() => {
    const h = window.__okadaInput;
    const rC = h.adapter.getEngineInput();
    document.body.classList.add("tutorial-locked");
    h.manager.apply("touch", { steer: 0.35, throttle: 1 });
    const locked = { steer: rC.steerDir, forward: rC.forward };
    document.body.classList.remove("tutorial-locked");
    const unlocked = { steer: rC.steerDir, forward: rC.forward };
    h.manager.reset();
    return { locked, unlocked };
  });
  check("interlock suppresses steer when locked", interlock.locked.steer === 0 && interlock.locked.forward === false, JSON.stringify(interlock.locked));
  check("interlock resumes after unlock", interlock.unlocked.steer === 0.35 && interlock.unlocked.forward === true, JSON.stringify(interlock.unlocked));

  // descriptor restore on dispose
  const restore = await frame.evaluate(async () => {
    const h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: false });
    const rC = h.adapter.getEngineInput();
    h.manager.apply("touch", { steer: 0.35 });
    const before = rC.steerDir;
    h.dispose();
    const after = rC.steerDir;
    return { before, after };
  });
  check("descriptor restored on dispose (override removed)", restore.before === 0.35 && restore.after === 0, JSON.stringify(restore));

  // ============ LAYER C: touch source events ============
  currentLayer = "C";
  const c = await withTimeout(frame.evaluate(async () => {
    try {
    console.log("[C] start");
    const h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true });
    console.log("[C] init done h=" + !!h);
    const out = {};
    // F1: style in head, root DIV in body
    const style = document.getElementById("okada-phase1-controls-style");
    const root = document.getElementById("okada-phase1-controls-root");
    out.f1 = {
      styleInHead: style && style.tagName === "STYLE" && style.parentNode === document.head,
      rootIsDivInBody: root && root.tagName === "DIV" && root.parentNode === document.body,
      gasIsChild: root && document.getElementById("okada-btn-throttle")?.parentNode === root,
      steerIsChild: root && document.getElementById("okada-steer")?.parentNode === root,
    };
    const gas = document.getElementById("okada-btn-throttle");
    const steer = document.getElementById("okada-steer");
    const brk = document.getElementById("okada-btn-brake");

    // GAS down/up
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, cancelable: true }));
    out.gasDown = h.manager.getState().throttle === 1;
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
    out.gasUp = h.manager.getState().throttle === 0;

    // multitouch: pointer1 + pointer2 GAS, pointer1 up -> still active (Policy A)
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, cancelable: true }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2, bubbles: true, cancelable: true }));
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
    out.multiOwnerStillActive = h.manager.getState().throttle === 1;
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2, bubbles: true }));
    out.multiOwnerReleased = h.manager.getState().throttle === 0;

    // simultaneous steer + GAS, then release GAS (steer must remain)
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 10, bubbles: true, cancelable: true, clientX: 100 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 130 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 20, bubbles: true, cancelable: true }));
    const sim = h.manager.getState();
    out.simSteer = sim.steer;
    out.simThrottle = sim.throttle;
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 20, bubbles: true }));
    out.steerStillOwnedAfterGasUp = h.manager.getState().steer !== 0 && h.manager.getState().throttle === 0;
    steer.dispatchEvent(new PointerEvent("pointerup", { pointerId: 10, bubbles: true }));
    out.steerReleased = h.manager.getState().steer === 0;

    // pointer cancel neutralizes
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, cancelable: true }));
    gas.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true }));
    out.cancelNeutral = h.manager.getState().throttle === 0;

    // F2: blur reset + no resurrection
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true, cancelable: true }));
    out.throttleBeforeBlur = h.manager.getState().throttle;
    window.dispatchEvent(new Event("blur"));
    out.throttleAfterBlur = h.manager.getState().throttle;
    brk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 3, bubbles: true, cancelable: true }));
    out.throttleAfterBrk = h.manager.getState().throttle; // must still be 0
    out.brakeAfterBrk = h.manager.getState().brake;
    out.reverseAfterBrk = h.manager.getState().reverse;
    brk.dispatchEvent(new PointerEvent("pointerup", { pointerId: 3, bubbles: true }));

    // Visibility must reset the source as well as the resolved manager state.
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    if (hiddenDescriptor) Object.defineProperty(document, "hidden", hiddenDescriptor);
    else delete document.hidden;
    brk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 3, bubbles: true }));
    out.visibilityNoResurrection = h.manager.getState().throttle === 0 && (h.manager.getState().brake === 1 || h.manager.getState().reverse === 1);
    h.reset("test");

    // Hold actual source owners across the mode boundary, then send late events.
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 10, clientX: 100 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, clientX: 130 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 20 }));
    out.heldBeforeStore = h.manager.getState().steer === 0.5 && h.manager.getState().throttle === 1;

    // F4: mode visibility + analog walk
    out.walkHiddenInitially = getComputedStyle(document.getElementById("okada-walk")).display === "none";
    document.body.classList.add("in-store-mode");
    await new Promise((r) => setTimeout(r, 50)); // let MutationObserver fire
    out.walkVisibleInStore = getComputedStyle(document.getElementById("okada-walk")).display !== "none";
    out.drivingHiddenInStore = getComputedStyle(document.getElementById("okada-steer")).display === "none";
    out.drivingButtonsHidden = [gas, brk, document.getElementById("okada-btn-drift")].every(el => getComputedStyle(el).display === "none");
    const interact = document.getElementById("okada-btn-interact");
    const ir = interact.getBoundingClientRect();
    out.interactVisible = getComputedStyle(interact).display !== "none" && ir.width > 0 && ir.height > 0;
    out.interactHitTest = interact.contains(document.elementFromPoint(ir.left + ir.width / 2, ir.top + ir.height / 2));
    out.drivingOwnersCleared = h.touch.steerOwner === null && [...h.touch.buttonOwners.values()].every(owners => owners.size === 0) && h.touch.capturedPointers.size === 0;
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, clientX: 145 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 20 }));
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 20 }));
    out.oldDrivingIgnored = h.manager.getState().steer === 0 && h.manager.getState().throttle === 0;
    const walk = document.getElementById("okada-walk");
    const wr = walk.getBoundingClientRect();
    walk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 5, bubbles: true, cancelable: true, clientX: wr.left + wr.width * 0.5, clientY: wr.top + wr.height * 0.5 }));
    walk.dispatchEvent(new PointerEvent("pointermove", { pointerId: 5, bubbles: true, clientX: wr.left + wr.width * 0.5 + 40, clientY: wr.top + wr.height * 0.5 - 40 }));
    const walkVec = h.manager.getState();
    out.walkX = walkVec.walkX;
    out.walkY = walkVec.walkY;
    out.walkNonCardinal = walkVec.walkX !== 0 && walkVec.walkY !== 0;
    document.body.classList.remove("in-store-mode");
    await new Promise((r) => setTimeout(r, 50));
    out.walkResetAfterModeExit = h.manager.getState().walkX === 0 && h.manager.getState().walkY === 0;
    out.walkOwnerCleared = h.touch.walkOwner === null && h.touch.capturedPointers.size === 0;
    walk.dispatchEvent(new PointerEvent("pointermove", { pointerId: 5, clientX: wr.right, clientY: wr.top }));
    walk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 5, clientX: wr.right, clientY: wr.top }));
    out.oldWalkIgnored = h.manager.getState().walkX === 0 && h.manager.getState().walkY === 0;

    window.__okadaVerifyHandle = h;
    return out;
    } catch (e) { return { error: String(e && e.stack || e) }; }
  }), 45000, "layer C");

  check("F1 style in head, root DIV in body", c.f1.styleInHead && c.f1.rootIsDivInBody, JSON.stringify(c.f1));
  check("F1 controls are children of root", c.f1.gasIsChild && c.f1.steerIsChild);
  check("GAS down/up", c.gasDown && c.gasUp, JSON.stringify({ gasDown: c.gasDown, gasUp: c.gasUp }));
  check("F3 multi-owner (p1+p2 down, p1 up -> still active)", c.multiOwnerStillActive && c.multiOwnerReleased, JSON.stringify({ still: c.multiOwnerStillActive, released: c.multiOwnerReleased }));
  check("F3 simultaneous steer + GAS", c.simSteer !== 0 && c.simThrottle === 1, JSON.stringify({ steer: c.simSteer, throttle: c.simThrottle }));
  check("F3 GAS up does not reset steer", c.steerStillOwnedAfterGasUp && c.steerReleased);
  check("pointer cancel neutralizes", c.cancelNeutral);
  check("F2 blur resets throttle", c.throttleBeforeBlur === 1 && c.throttleAfterBlur === 0, JSON.stringify({ before: c.throttleBeforeBlur, after: c.throttleAfterBlur }));
  check("F2 no stale resurrection (BRAKE/REV does not restore throttle)", c.throttleAfterBrk === 0 && (c.brakeAfterBrk === 1 || c.reverseAfterBrk === 1), JSON.stringify({ throttle: c.throttleAfterBrk, brake: c.brakeAfterBrk, reverse: c.reverseAfterBrk }));
  check("F4 walk hidden in driving", c.walkHiddenInitially);
  check("F4 walk visible in store, driving hidden", c.walkVisibleInStore && c.drivingHiddenInStore, JSON.stringify({ walkVisible: c.walkVisibleInStore, drivingHidden: c.drivingHiddenInStore }));
  check("F4 analog non-cardinal walk via pointer", c.walkNonCardinal, JSON.stringify({ x: c.walkX, y: c.walkY }));
  check("F4 mode exit resets walk", c.walkResetAfterModeExit);
  check("visibility reset prevents stale GAS", c.visibilityNoResurrection);
  check("store Interact visible and hit-testable; driving-only buttons hidden", c.interactVisible && c.interactHitTest && c.drivingButtonsHidden);
  check("STORE revokes held driving owners and rejects late pointer events", c.heldBeforeStore && c.drivingOwnersCleared && c.oldDrivingIgnored);
  check("DRIVING revokes walking owner and rejects late pointer events", c.walkResetAfterModeExit && c.walkOwnerCleared && c.oldWalkIgnored);

  // Trusted browser touch input, not dispatchEvent or manager.apply. This checks
  // the rendered store-mode control; actual mission navigation is a separate check.
  await page.evaluate(() => document.body.classList.add("in-store-mode"));
  await page.waitForFunction(() => document.getElementById("okada-phase1-controls-root").classList.contains("mode-store"));
  const point = await page.evaluate(() => {
    const el = document.getElementById("okada-btn-interact");
    el.addEventListener("pointerdown", (event) => {
      window.__okadaVerifyPress = { trusted: event.isTrusted, type: event.pointerType, interact: window.__okadaInput.adapter.getEngineInput().interact };
    }, { once: true });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.touchscreen.tap(point.x, point.y);
  const pressed = await page.evaluate(() => window.__okadaVerifyPress);
  check("visible store Interact trusted touch reaches engine input", pressed?.trusted === true && pressed?.type === "touch" && pressed?.interact === true, JSON.stringify(pressed));
  await page.evaluate(() => { window.__okadaVerifyHandle.dispose(); delete window.__okadaVerifyHandle; document.body.classList.remove("in-store-mode"); });

  // ============ LAYER D: lifecycle ============
  currentLayer = "D";
  const d = await frame.evaluate(async () => {
    const out = {};
    // aborted signal -> no handle installed
    const ac = new AbortController();
    ac.abort();
    const aborted = await window.OkadaInput.initOkadaInput(window, document, { touchControls: false, signal: ac.signal });
    out.abortedReturnsNull = aborted === null;
    out.noGlobalAfterAbort = !window.__okadaInput;
    // dispose idempotent
    const h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: false });
    h.dispose();
    h.dispose();
    out.disposeIdempotent = true;
    return out;
  });
  check("aborted signal -> null handle", d.abortedReturnsNull && d.noGlobalAfterAbort, JSON.stringify(d));
  check("dispose idempotent", d.disposeIdempotent);

  currentLayer = "E";
  await verifyStoreInteractions(page, check);

  await browser.close();
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n===== VERIFY SUMMARY: ${pass} pass, ${fail} fail =====`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("VERIFY FAILURE", e); process.exit(1); });
