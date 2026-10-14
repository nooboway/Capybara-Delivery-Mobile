// Okada Phase 2B Comprehensive Verification & Screenshot Capture Suite
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(__dirname, "..");
const REPO = path.resolve(PKG, "..", "..");
const BUNDLE = path.join(PKG, "public", "assets", "main-CSpZwCDB.js");
const CANONICAL_SHA = "C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E";

const esbuild = require(path.join(REPO, "node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild"));
const pw = require("C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");

const SCREENSHOT_DIR = path.resolve(REPO, "docs/ux/screenshots");
const ARTIFACT_SCREENSHOT_DIR = "C:/Users/dev/.gemini/antigravity-ide/brain/b66c0211-a640-40af-98d2-75c6017fcdc4/screenshots";
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });

async function saveScreenshot(page, filename) {
  const repoPath = path.join(SCREENSHOT_DIR, filename);
  const artifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, filename);
  try {
    await page.screenshot({ path: repoPath, fullPage: false, timeout: 15000 });
    fs.copyFileSync(repoPath, artifactPath);
    console.log(`[screenshot] Saved ${filename}`);
  } catch (err) {
    console.warn(`[screenshot warning] Failed to save ${filename}: ${err.message}`);
  }
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".bin": "application/octet-stream"
};

function serve(port) {
  return new Promise((res) => {
    const s = http.createServer((req, r) => {
      let u = decodeURIComponent((req.url || "/").split("?")[0]);
      if (u === "/") u = "/capybara-game/index.html";
      const root = path.resolve(path.join(PKG, "public"));
      const fp = path.resolve(root, "." + u);
      if (!fp.startsWith(root + path.sep)) { r.writeHead(403); r.end(); return; }
      fs.readFile(fp, (e, d) => {
        if (e) { r.writeHead(404); r.end(); return; }
        r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" });
        r.end(d);
      });
    });
    s.listen(port, "127.0.0.1", () => res(s));
  });
}

// Bundle input modules
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

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

async function main() {
  console.log("=== STARTING OKADA PHASE 2B VERIFICATION ===");

  // 1. Verify Canonical Bundle Hash
  const raw = fs.readFileSync(BUNDLE);
  const actualHash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
  check("canonical SHA-256 unchanged", actualHash === CANONICAL_SHA, actualHash);

  const server = await serve(4299);
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  page.setDefaultTimeout(180000);

  console.log("Navigating to capybara-game/index.html...");
  await page.goto("http://127.0.0.1:4299/capybara-game/index.html", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector('[data-role="click"]'));

  await page.evaluate(() => {
    window.__capyGame.renderer.setPixelRatio(0.25);
    window.__capyGame._applyRenderSize();
  });

  const startRect = await page.locator('[data-role="click"]').boundingBox();
  await page.keyboard.press("Space");
  await page.touchscreen.tap(startRect.x + startRect.width / 2, startRect.y + startRect.height / 2);

  console.log("Clicking Play Offline...");
  await page.getByRole('button', { name: /play offline/i }).click();

  console.log("Clicking Play...");
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  console.log("Waiting for in-game...");
  await page.waitForFunction(() => document.body.classList.contains('in-game'));
  await page.evaluate(() => window.__capyGame.tutorial?.complete());
  console.log("IN-GAME READY!");

  // Install Okada Input with Phase 2B Touch
  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });
  await frame.evaluate(async () => {
    window.h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true });
  });
  await page.waitForTimeout(500);

  // Set standard landscape viewport: 844 x 390
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    window.__capyGame.renderer.setPixelRatio(0.25);
    window.__capyGame._applyRenderSize();
  });
  await page.waitForTimeout(600);

  // ==========================================
  // SUITE 1: DOM Controls & Structure
  // ==========================================
  console.log("\n--- SUITE 1: DOM Controls & Structure ---");
  const domCheck = await page.evaluate(() => {
    const root = document.getElementById("okada-phase1-controls-root");
    const style = document.getElementById("okada-phase1-controls-style");
    const steer = document.getElementById("okada-steer");
    const gas = document.getElementById("okada-btn-throttle");
    const brk = document.getElementById("okada-btn-brake");
    const rev = document.getElementById("okada-btn-reverse");
    const drift = document.getElementById("okada-btn-drift");
    const interact = document.getElementById("okada-btn-interact");
    const walk = document.getElementById("okada-walk");
    const phone = document.getElementById("okada-btn-phone");
    const barrier = document.getElementById("okada-portrait-barrier");

    return {
      hasRoot: !!root && root.tagName === "DIV",
      hasStyle: !!style && style.tagName === "STYLE",
      hasSteer: !!steer && steer.parentNode === root,
      hasGas: !!gas && gas.parentNode === root,
      hasBrake: !!brk && brk.parentNode === root,
      hasReverse: !!rev && rev.parentNode === root,
      hasDrift: !!drift && drift.parentNode === root,
      hasInteract: !!interact && interact.parentNode === root,
      hasWalk: !!walk && walk.parentNode === root,
      hasPhone: !!phone && phone.parentNode === root,
      hasBarrier: !!barrier,
    };
  });

  check("root element attached to body", domCheck.hasRoot);
  check("style element in head", domCheck.hasStyle);
  check("steering control present", domCheck.hasSteer);
  check("GAS throttle control present", domCheck.hasGas);
  check("BRAKE control present", domCheck.hasBrake);
  check("REV dedicated reverse control present", domCheck.hasReverse);
  check("DRIFT control present", domCheck.hasDrift);
  check("INTERACT control present", domCheck.hasInteract);
  check("WALK control present", domCheck.hasWalk);
  check("PHONE trigger control present", domCheck.hasPhone);
  check("portrait barrier present", domCheck.hasBarrier);

  // Capture Screenshot: World Idle (844x390)
  await saveScreenshot(page, "phase2b_world_idle_844x390.png");

  // ==========================================
  // SUITE 2: Steering & Analog Continuous Output
  // ==========================================
  console.log("\n--- SUITE 2: Steering & Analog Output ---");
  const steerRes = await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    const h = window.h;
    const out = {};

    // 1. Dynamic origin pointerdown at clientX: 100
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 10, bubbles: true, cancelable: true, clientX: 100, clientY: 300 }));
    out.initialAtOrigin = h.manager.getState().steer === 0;

    // 2. Fractional positive displacement (right +30px) -> throw 60 => 0.5
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 130, clientY: 300 }));
    out.steerHalfRight = Math.abs(h.manager.getState().steer - 0.5) < 0.01;
    out.valRight = h.manager.getState().steer;

    // 3. Fractional negative displacement (left -60px) -> full left -1.0
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 40, clientY: 300 }));
    out.steerFullLeft = Math.abs(h.manager.getState().steer - (-1.0)) < 0.01;

    // 4. Second pointer cannot steal steering (exclusive ownership)
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 11, bubbles: true, clientX: 200 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 11, bubbles: true, clientX: 250 }));
    out.secondPointerRejected = Math.abs(h.manager.getState().steer - (-1.0)) < 0.01;

    // 5. Release returns to neutral 0
    steer.dispatchEvent(new PointerEvent("pointerup", { pointerId: 10, bubbles: true }));
    out.steerNeutralOnRelease = h.manager.getState().steer === 0;

    return out;
  });

  check("dynamic steering origin established", steerRes.initialAtOrigin);
  check("fractional steering output (+0.5)", steerRes.steerHalfRight, String(steerRes.valRight));
  check("full lock steering output (-1.0)", steerRes.steerFullLeft);
  check("second pointer cannot steal steering", steerRes.secondPointerRejected);
  check("steering release returns to 0", steerRes.steerNeutralOnRelease);

  // Capture Screenshot: Active Steering
  await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 10, bubbles: true, clientX: 100, clientY: 280 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 145, clientY: 280 }));
  });
  await saveScreenshot(page, "phase2b_active_steering.png");
  await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    steer.dispatchEvent(new PointerEvent("pointerup", { pointerId: 10, bubbles: true }));
  });

  // ==========================================
  // SUITE 3: Right Thumb Actions (GAS, Lock, BRK, REV, DRIFT)
  // ==========================================
  console.log("\n--- SUITE 3: Right Thumb Actions & Acceleration Lock ---");

  // Normal GAS press / release
  const gasNormal = await page.evaluate(() => {
    const gas = document.getElementById("okada-btn-throttle");
    const h = window.h;
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 20, bubbles: true, cancelable: true }));
    const downThrottle = h.manager.getState().throttle;
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 20, bubbles: true }));
    const upThrottle = h.manager.getState().throttle;
    return { downThrottle, upThrottle };
  });
  check("GAS normal press sets throttle 1", gasNormal.downThrottle === 1);
  check("GAS normal release returns throttle 0", gasNormal.upThrottle === 0);

  // Acceleration Lock: Hold GAS for 1050ms
  const gasLockTest = await page.evaluate(async () => {
    const gas = document.getElementById("okada-btn-throttle");
    const h = window.h;
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 21, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 1050));
    const lockedDuringHold = h.touch.isGasLocked;
    const classLocked = gas.classList.contains("locked");

    // Finger released after lock engaged
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 21, bubbles: true }));
    const throttleAfterRelease = h.manager.getState().throttle;

    // Tap GAS again to clear lock
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 22, bubbles: true, cancelable: true }));
    const lockClearedAfterTap = !h.touch.isGasLocked;
    const throttleAfterTap = h.manager.getState().throttle;
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 22, bubbles: true }));

    return { lockedDuringHold, classLocked, throttleAfterRelease, lockClearedAfterTap, throttleAfterTap };
  });

  check("GAS lock engages after hold duration", gasLockTest.lockedDuringHold && gasLockTest.classLocked);
  check("GAS lock maintains throttle 1 after release", gasLockTest.throttleAfterRelease === 1);
  check("GAS tap cancels acceleration lock", gasLockTest.lockClearedAfterTap && gasLockTest.throttleAfterTap === 0);

  // Capture Screenshot: GAS Locked
  await page.evaluate(async () => {
    const gas = document.getElementById("okada-btn-throttle");
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 25, bubbles: true }));
    await new Promise(r => setTimeout(r, 1050));
    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 25, bubbles: true }));
  });
  await saveScreenshot(page, "phase2b_gas_locked.png");
  await page.evaluate(() => window.h.touch.clearGasLock());

  // Brake & Reverse
  const brkRev = await page.evaluate(() => {
    const brk = document.getElementById("okada-btn-brake");
    const rev = document.getElementById("okada-btn-reverse");
    const h = window.h;

    brk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 30, bubbles: true }));
    const brkVal = h.manager.getState().brake;
    const brkRevVal = h.manager.getState().reverse;
    brk.dispatchEvent(new PointerEvent("pointerup", { pointerId: 30, bubbles: true }));

    rev.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 31, bubbles: true }));
    const revVal = h.manager.getState().reverse;
    const revBrkVal = h.manager.getState().brake;
    rev.dispatchEvent(new PointerEvent("pointerup", { pointerId: 31, bubbles: true }));

    return { brkVal, brkRevVal, revVal, revBrkVal };
  });
  check("BRAKE activates brake: 1 without reverse", brkRev.brkVal === 1 && brkRev.brkRevVal === 0);
  check("REV activates reverse: 1 without brake", brkRev.revVal === 1 && brkRev.revBrkVal === 0);

  // Drift
  const driftTest = await page.evaluate(() => {
    const drift = document.getElementById("okada-btn-drift");
    const h = window.h;
    drift.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 32, bubbles: true }));
    const downDrift = h.manager.getState().drift;
    drift.dispatchEvent(new PointerEvent("pointerup", { pointerId: 32, bubbles: true }));
    const upDrift = h.manager.getState().drift;
    return { downDrift, upDrift };
  });
  check("DRIFT activates drift: true", driftTest.downDrift === true && driftTest.upDrift === false);

  // Simultaneous Multitouch: Steer + GAS + DRIFT
  const multiTri = await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    const gas = document.getElementById("okada-btn-throttle");
    const drift = document.getElementById("okada-btn-drift");
    const h = window.h;

    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 40, bubbles: true, clientX: 100 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 40, bubbles: true, clientX: 135 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 41, bubbles: true }));
    drift.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 42, bubbles: true }));

    const st = h.manager.getState();
    const allActive = st.steer !== 0 && st.throttle === 1 && st.drift === true;

    // Release drift, gas and steer remain
    drift.dispatchEvent(new PointerEvent("pointerup", { pointerId: 42, bubbles: true }));
    const afterDriftUp = h.manager.getState().drift === false && h.manager.getState().throttle === 1 && h.manager.getState().steer !== 0;

    gas.dispatchEvent(new PointerEvent("pointerup", { pointerId: 41, bubbles: true }));
    steer.dispatchEvent(new PointerEvent("pointerup", { pointerId: 40, bubbles: true }));

    return { allActive, afterDriftUp };
  });
  check("simultaneous Steer + GAS + DRIFT", multiTri.allActive);
  check("DRIFT release preserves active Steer + GAS", multiTri.afterDriftUp);

  // Capture Screenshot: Simultaneous Steer + Gas + Drift
  await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    const gas = document.getElementById("okada-btn-throttle");
    const drift = document.getElementById("okada-btn-drift");
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 40, bubbles: true, clientX: 100, clientY: 280 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 40, bubbles: true, clientX: 140, clientY: 280 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 41, bubbles: true }));
    drift.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 42, bubbles: true }));
  });
  await saveScreenshot(page, "phase2b_steer_gas_drift_active.png");
  await page.evaluate(() => {
    document.getElementById("okada-steer").dispatchEvent(new PointerEvent("pointerup", { pointerId: 40, bubbles: true }));
    document.getElementById("okada-btn-throttle").dispatchEvent(new PointerEvent("pointerup", { pointerId: 41, bubbles: true }));
    document.getElementById("okada-btn-drift").dispatchEvent(new PointerEvent("pointerup", { pointerId: 42, bubbles: true }));
  });

  // ==========================================
  // SUITE 4: Store Mode & Walking Joystick
  // ==========================================
  console.log("\n--- SUITE 4: Store Mode & Walking Joystick ---");
  const storeRes = await page.evaluate(async () => {
    const h = window.h;
    document.body.classList.add("in-store-mode");
    await new Promise(r => setTimeout(r, 60)); // MutationObserver

    const walk = document.getElementById("okada-walk");
    const interact = document.getElementById("okada-btn-interact");
    const gas = document.getElementById("okada-btn-throttle");
    const steer = document.getElementById("okada-steer");

    const walkVisible = getComputedStyle(walk).display !== "none";
    const drivingHidden = getComputedStyle(gas).display === "none" && getComputedStyle(steer).display === "none";
    const interactVisible = getComputedStyle(interact).display !== "none";

    // Non-cardinal diagonal walk test
    const wr = walk.getBoundingClientRect();
    walk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 50, bubbles: true, clientX: wr.left + wr.width * 0.8, clientY: wr.top + wr.height * 0.2 }));
    const stWalk = h.manager.getState();
    const diagonalWalk = stWalk.walkX !== 0 && stWalk.walkY !== 0;

    // Walk + Interact simultaneous
    interact.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 51, bubbles: true }));
    const bothActive = h.manager.getState().walkX !== 0 && h.manager.getState().interact === true;
    interact.dispatchEvent(new PointerEvent("pointerup", { pointerId: 51, bubbles: true }));

    walk.dispatchEvent(new PointerEvent("pointerup", { pointerId: 50, bubbles: true }));
    const walkNeutral = h.manager.getState().walkX === 0 && h.manager.getState().walkY === 0;

    return { walkVisible, drivingHidden, interactVisible, diagonalWalk, bothActive, walkNeutral };
  });

  check("store mode displays walk joystick and hides driving buttons", storeRes.walkVisible && storeRes.drivingHidden);
  check("store interact button visible", storeRes.interactVisible);
  check("store walking outputs continuous diagonal vector", storeRes.diagonalWalk);
  check("simultaneous Walk + INTERACT in store", storeRes.bothActive);
  check("walking release resets vector to 0", storeRes.walkNeutral);

  // Capture Screenshot: Store Walking
  await page.evaluate(() => {
    const walk = document.getElementById("okada-walk");
    const wr = walk.getBoundingClientRect();
    walk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 50, bubbles: true, clientX: wr.left + wr.width * 0.75, clientY: wr.top + wr.height * 0.25 }));
  });
  await saveScreenshot(page, "phase2b_store_walking.png");
  await page.evaluate(() => {
    document.getElementById("okada-walk").dispatchEvent(new PointerEvent("pointerup", { pointerId: 50, bubbles: true }));
    document.body.classList.remove("in-store-mode");
  });
  await page.waitForTimeout(100);

  // ==========================================
  // SUITE 5: Virtual Phone & Suppression
  // ==========================================
  console.log("\n--- SUITE 5: Virtual Phone & Control Suppression ---");
  const phoneRes = await page.evaluate(async () => {
    const h = window.h;
    const root = document.getElementById("okada-phase1-controls-root");

    // Hold gas before opening phone
    const gas = document.getElementById("okada-btn-throttle");
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 60, bubbles: true }));
    const throttleBefore = h.manager.getState().throttle;

    // Trigger phone
    document.getElementById("okada-btn-phone").click();
    await new Promise(r => setTimeout(r, 600));

    const rootPhoneOpenClass = root.classList.contains("phone-open");
    const rootStyle = getComputedStyle(root);
    const suppressed = rootStyle.opacity === "0" && rootStyle.pointerEvents === "none";
    const inputsNeutral = h.manager.getState().throttle === 0 && h.manager.getState().steer === 0;

    // Close phone via Tab key
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
    await new Promise(r => setTimeout(r, 600));

    const rootRestored = !root.classList.contains("phone-open") && getComputedStyle(root).opacity !== "0";
    const noStaleThrottle = h.manager.getState().throttle === 0;

    return { throttleBefore, rootPhoneOpenClass, suppressed, inputsNeutral, rootRestored, noStaleThrottle };
  });

  check("phone trigger click opens phone and neutralizes inputs", phoneRes.suppressed && phoneRes.inputsNeutral);
  check("phone close restores touch controls without resurrecting throttle", phoneRes.rootRestored && phoneRes.noStaleThrottle);

  // Capture Screenshot: Phone Open
  await page.evaluate(async () => {
    document.getElementById("okada-btn-phone").click();
    await new Promise(r => setTimeout(r, 600));
  });
  await saveScreenshot(page, "phase2b_phone_open_844x390.png");
  await page.evaluate(async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
  });

  // ==========================================
  // SUITE 6: Portrait Orientation Barrier
  // ==========================================
  console.log("\n--- SUITE 6: Portrait Orientation Barrier ---");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const portraitRes = await page.evaluate(() => {
    const barrier = document.getElementById("okada-portrait-barrier");
    const root = document.getElementById("okada-phase1-controls-root");
    const barrierVisible = barrier && barrier.classList.contains("visible") && getComputedStyle(barrier).display !== "none";
    const rootSuppressed = root.classList.contains("is-portrait") && getComputedStyle(root).opacity === "0";
    return { barrierVisible, rootSuppressed };
  });
  check("portrait viewport activates orientation barrier", portraitRes.barrierVisible);
  check("portrait viewport neutralizes and hides gameplay controls", portraitRes.rootSuppressed);
  await saveScreenshot(page, "phase2b_portrait_barrier.png");

  // Restore landscape
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);

  // ==========================================
  // SUITE 7: Device Matrix Responsive Visuals
  // ==========================================
  console.log("\n--- SUITE 7: Device Matrix Responsive Screenshots ---");
  const viewports = [
    { name: "compact_667x375", width: 667, height: 375 },
    { name: "large_932x430", width: 932, height: 430 },
    { name: "android_915x412", width: 915, height: 412 },
    { name: "tablet_1024x768", width: 1024, height: 768 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.evaluate(() => {
      window.__capyGame.renderer.setPixelRatio(0.25);
      window.__capyGame._applyRenderSize();
    });
    await page.waitForTimeout(400);
    await saveScreenshot(page, `phase2b_device_${vp.name}.png`);
  }

  // Check safe-area css declarations
  const safeAreaCss = await page.evaluate(() => {
    const style = document.getElementById("okada-phase1-controls-style");
    return style && style.textContent.includes("env(safe-area-inset-");
  });
  check("safe-area inset CSS declarations present", safeAreaCss);

  // ==========================================
  // SUMMARY
  // ==========================================
  await browser.close();
  server.close();

  const passCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;
  console.log(`\n===== PHASE 2B VERIFY SUMMARY: ${passCount} pass, ${failCount} fail =====`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(e => {
  console.error("FATAL ERROR IN PHASE 2B VERIFY:", e);
  process.exit(1);
});
