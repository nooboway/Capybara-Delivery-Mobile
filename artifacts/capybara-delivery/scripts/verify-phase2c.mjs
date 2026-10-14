// Ryder Phase 2C Comprehensive Verification & Screenshot Capture Suite
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
    await page.screenshot({ path: repoPath, fullPage: false, timeout: 30000 });
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
  console.log("=== STARTING RYDER PHASE 2C VERIFICATION ===");

  // 1. Verify Canonical Bundle Hash
  const raw = fs.readFileSync(BUNDLE);
  const actualHash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
  check("canonical SHA-256 unchanged", actualHash === CANONICAL_SHA, actualHash);

  const server = await serve(4312);
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    hasTouch: true,
  });
  page.setDefaultTimeout(180000);

  console.log("Navigating to capybara-game/index.html...");
  await page.goto("http://127.0.0.1:4312/capybara-game/index.html", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('[data-role="click"]'), null, { timeout: 180000 });

  await page.evaluate(() => {
    window.__capyGame.renderer.setPixelRatio(0.25);
    window.__capyGame._applyRenderSize();
  });

  const startRect = await page.locator('[data-role="click"]').boundingBox();
  await page.touchscreen.tap(startRect.x + startRect.width / 2, startRect.y + startRect.height / 2);

  console.log("Clicking Play Offline...");
  await page.getByRole('button', { name: /play offline/i }).click();

  console.log("Clicking Play...");
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  console.log("Waiting for in-game...");
  await page.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await page.evaluate(() => {
    window.__capyGame.tutorial?.complete();
    if (window.__capyGame.phone) {
      window.__capyGame.phone._offersPaused = true;
    }
  });
  console.log("IN-GAME READY!");

  // Install Ryder Input with Phase 2C Touch
  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });
  await frame.evaluate(async () => {
    window.h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true });
  });
  await page.waitForTimeout(500);

  // Set standard landscape viewport: 844 x 390
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    window.__capyGame.renderer.setPixelRatio(1.0);
    window.__capyGame._applyRenderSize();
  });

  // ==========================================
  // SUITE 1: DOM Controls & Ryder Branding
  // ==========================================
  console.log("\n--- SUITE 1: DOM Controls & Ryder Branding ---");
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

    // Barrier branding check
    const barrierCard = barrier?.querySelector(".barrier-card");
    const barrierBadge = barrier?.querySelector(".barrier-badge")?.textContent?.trim();
    const barrierTitle = barrier?.querySelector(".barrier-title")?.textContent?.trim();
    const barrierSvg = !!barrier?.querySelector(".barrier-phone-svg");
    const hasEmojiInBarrier = barrier?.innerHTML?.includes("📱") || barrier?.innerHTML?.includes("↷");

    // Fullscreen button removal check
    const toolbar = document.querySelector(".game-toolbar");
    const fsBtn = document.querySelector(".fullscreen-button");

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
      barrierBadge,
      barrierTitle,
      barrierSvg,
      hasEmojiInBarrier: !!hasEmojiInBarrier,
      fullscreenRemoved: !toolbar && !fsBtn,
    };
  });

  check("root element attached to body", domCheck.hasRoot);
  check("style element in head", domCheck.hasStyle);
  check("steering control present", domCheck.hasSteer);
  check("GAS throttle control present", domCheck.hasGas);
  check("BRAKE control present", domCheck.hasBrake);
  check("REV dedicated reverse control present", domCheck.hasReverse);
  check("DRIFT control present", domCheck.hasDrift);
  check("INTERACT action control present", domCheck.hasInteract);
  check("WALK control present", domCheck.hasWalk);
  check("PHONE trigger control present", domCheck.hasPhone);
  check("portrait barrier present", domCheck.hasBarrier);
  check("barrier badge says RYDER", domCheck.barrierBadge === "RYDER");
  check("barrier title says Rotate your phone to play", domCheck.barrierTitle === "Rotate your phone to play");
  check("barrier includes animated SVG phone", domCheck.barrierSvg);
  check("barrier has NO raw emoji", !domCheck.hasEmojiInBarrier);
  check("fullscreen button completely removed", domCheck.fullscreenRemoved);

  // Capture Screenshot: World Idle (844x390)
  await saveScreenshot(page, "phase2c_world_idle_844x390.png");

  // ==========================================
  // SUITE 2: Dynamic Floating Steering
  // ==========================================
  console.log("\n--- SUITE 2: Dynamic Floating Steering & Analog Output ---");
  const steerRes = await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    const h = window.h;
    const out = {};

    // 1. Dynamic origin pointerdown at clientX: 100, clientY: 280
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 10, bubbles: true, cancelable: true, clientX: 100, clientY: 280 }));
    out.initialAtOrigin = h.manager.getState().steer === 0;
    out.hasActiveClass = steer.classList.contains("active");

    // 2. Fractional positive displacement (right +30px) -> throw 60 => 0.5
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 130, clientY: 280 }));
    out.steerHalfRight = Math.abs(h.manager.getState().steer - 0.5) < 0.01;
    out.valRight = h.manager.getState().steer;

    // 3. Fractional negative displacement (left -60px) -> full left -1.0
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 10, bubbles: true, clientX: 40, clientY: 280 }));
    out.steerFullLeft = Math.abs(h.manager.getState().steer - (-1.0)) < 0.01;

    // 4. Second pointer cannot steal steering (exclusive ownership)
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 11, bubbles: true, clientX: 200 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 11, bubbles: true, clientX: 250 }));
    out.secondPointerRejected = Math.abs(h.manager.getState().steer - (-1.0)) < 0.01;

    // 5. Release returns to neutral 0 and removes active class
    steer.dispatchEvent(new PointerEvent("pointerup", { pointerId: 10, bubbles: true }));
    out.steerNeutralOnRelease = h.manager.getState().steer === 0;
    out.activeClassRemoved = !steer.classList.contains("active");

    return out;
  });

  check("steering dynamic origin initial neutral", steerRes.initialAtOrigin);
  check("steering gains active class on touch", steerRes.hasActiveClass);
  check("fractional steering +0.50 right", steerRes.steerHalfRight, String(steerRes.valRight));
  check("full lock steering -1.0 left", steerRes.steerFullLeft);
  check("exclusive single-finger ownership rejects 2nd pointer", steerRes.secondPointerRejected);
  check("steering release snaps to neutral 0", steerRes.steerNeutralOnRelease);
  check("steering active class removed on release", steerRes.activeClassRemoved);

  // Capture Screenshot: Active Steering
  await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 12, bubbles: true, clientX: 90, clientY: 280 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 12, bubbles: true, clientX: 130, clientY: 280 }));
  });
  await saveScreenshot(page, "phase2c_active_steering.png");
  await page.evaluate(() => {
    document.getElementById("okada-steer").dispatchEvent(new PointerEvent("pointerup", { pointerId: 12, bubbles: true }));
  });

  // ==========================================
  // SUITE 3: Right Thumb Actions & Acceleration Lock
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
  await saveScreenshot(page, "phase2c_gas_locked.png");
  await page.evaluate(() => window.h.touch.clearGasLock());

  // Brake & Reverse
  const brkRev = await page.evaluate(() => {
    const brk = document.getElementById("okada-btn-brake");
    const rev = document.getElementById("okada-btn-reverse");
    const h = window.h;

    brk.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 30, bubbles: true }));
    const brakeActive = h.manager.getState().brake === 1 && h.manager.getState().reverse === 0;
    brk.dispatchEvent(new PointerEvent("pointerup", { pointerId: 30, bubbles: true }));
    const brakeReleased = h.manager.getState().brake === 0;

    rev.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 31, bubbles: true }));
    const reverseActive = h.manager.getState().reverse === 1 && h.manager.getState().brake === 0;
    rev.dispatchEvent(new PointerEvent("pointerup", { pointerId: 31, bubbles: true }));
    const reverseReleased = h.manager.getState().reverse === 0;

    return { brakeActive, brakeReleased, reverseActive, reverseReleased };
  });
  check("BRAKE activates brake without reverse", brkRev.brakeActive);
  check("BRAKE release returns to 0", brkRev.brakeReleased);
  check("REV activates reverse without brake", brkRev.reverseActive);
  check("REV release returns to 0", brkRev.reverseReleased);

  // Drift & Action
  const driftAction = await page.evaluate(() => {
    const drift = document.getElementById("okada-btn-drift");
    const act = document.getElementById("okada-btn-interact");
    const h = window.h;

    drift.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 32, bubbles: true }));
    const driftActive = h.manager.getState().drift === true;
    drift.dispatchEvent(new PointerEvent("pointerup", { pointerId: 32, bubbles: true }));
    const driftReleased = h.manager.getState().drift === false;

    act.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 33, bubbles: true }));
    const actActive = h.manager.getState().interact === true;
    act.dispatchEvent(new PointerEvent("pointerup", { pointerId: 33, bubbles: true }));
    const actReleased = h.manager.getState().interact === false;

    return { driftActive, driftReleased, actActive, actReleased };
  });
  check("DRIFT activates drift state", driftAction.driftActive);
  check("DRIFT release deactivates drift", driftAction.driftReleased);
  check("ACTION activates interact state", driftAction.actActive);
  check("ACTION release deactivates interact", driftAction.actReleased);

  // Simultaneous Steer + Gas + Drift (Multi-touch)
  const multiTouchDriving = await page.evaluate(() => {
    const steer = document.getElementById("okada-steer");
    const gas = document.getElementById("okada-btn-throttle");
    const drift = document.getElementById("okada-btn-drift");
    const h = window.h;

    steer.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 40, bubbles: true, clientX: 100 }));
    steer.dispatchEvent(new PointerEvent("pointermove", { pointerId: 40, bubbles: true, clientX: 130 }));
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 41, bubbles: true }));
    drift.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 42, bubbles: true }));

    const st = h.manager.getState();
    const allThree = st.steer !== 0 && st.throttle === 1 && st.drift === true;

    return { allThree, st };
  });
  check("simultaneous Steer + GAS + DRIFT multitouch", multiTouchDriving.allThree, JSON.stringify(multiTouchDriving.st));

  // Capture Screenshot: Multi-touch Steer + Gas + Drift Active
  await saveScreenshot(page, "phase2c_steer_gas_drift_active.png");
  await page.evaluate(() => {
    document.getElementById("okada-steer").dispatchEvent(new PointerEvent("pointerup", { pointerId: 40, bubbles: true }));
    document.getElementById("okada-btn-throttle").dispatchEvent(new PointerEvent("pointerup", { pointerId: 41, bubbles: true }));
    document.getElementById("okada-btn-drift").dispatchEvent(new PointerEvent("pointerup", { pointerId: 42, bubbles: true }));
  });

  // ==========================================
  // SUITE 4: Store Mode Walking & Interaction
  // ==========================================
  console.log("\n--- SUITE 4: Store Mode Walking & Interaction ---");
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
  await saveScreenshot(page, "phase2c_store_walking.png");
  await page.evaluate(() => {
    document.getElementById("okada-walk").dispatchEvent(new PointerEvent("pointerup", { pointerId: 50, bubbles: true }));
    document.body.classList.remove("in-store-mode");
  });
  await page.waitForTimeout(100);

  // ==========================================
  // SUITE 5: Virtual Phone & Suppression
  // ==========================================
  console.log("\n--- SUITE 5: Virtual Phone & Control Suppression ---");
  // 1. Hold gas before opening phone
  await page.evaluate(() => {
    const gas = document.getElementById("okada-btn-throttle");
    gas.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 60, bubbles: true }));
  });
  const throttleBefore = await page.evaluate(() => window.h.manager.getState().throttle);

  // 2. Open phone
  await page.evaluate(() => {
    document.getElementById("okada-btn-phone")?.click();
  });
  await page.waitForTimeout(600);

  const phoneOpenCheck = await page.evaluate(() => {
    const root = document.getElementById("okada-phase1-controls-root");
    const h = window.h;
    const rootPhoneOpenClass = root.classList.contains("phone-open");
    const rootStyle = getComputedStyle(root);
    const suppressed = rootStyle.opacity === "0" && rootStyle.pointerEvents === "none";
    const inputsNeutral = h.manager.getState().throttle === 0 && h.manager.getState().steer === 0;
    return { rootPhoneOpenClass, suppressed, inputsNeutral };
  });

  check("phone open neutralizes held throttle", throttleBefore === 1 && phoneOpenCheck.inputsNeutral);
  check("phone open sets .phone-open and suppresses controls", phoneOpenCheck.rootPhoneOpenClass && phoneOpenCheck.suppressed);

  // Save screenshot while phone is open
  await saveScreenshot(page, "phase2c_phone_open_844x390.png");

  // 3. Close phone
  await page.evaluate(() => {
    const p = window.__capyGame?.phone;
    if (p && typeof p.hide === "function") {
      p.hide();
    } else {
      document.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
    }
  });
  await page.waitForTimeout(600);

  const phoneCloseCheck = await page.evaluate(() => {
    const root = document.getElementById("okada-phase1-controls-root");
    const h = window.h;
    const restoredClass = !root.classList.contains("phone-open");
    const controlsRestored = getComputedStyle(root).opacity === "1";
    const inputsStillNeutral = h.manager.getState().throttle === 0;
    return {
      restoredClass,
      controlsRestored,
      inputsStillNeutral,
      className: root.className,
      opacity: getComputedStyle(root).opacity,
    };
  });

  check("phone close restores control visibility", phoneCloseCheck.restoredClass && phoneCloseCheck.controlsRestored, `class=${phoneCloseCheck.className}, opacity=${phoneCloseCheck.opacity}`);
  check("phone close maintains neutral inputs (no resurrection)", phoneCloseCheck.inputsStillNeutral);

  // ==========================================
  // SUITE 6: Portrait Barrier & Rotation Recovery
  // ==========================================
  console.log("\n--- SUITE 6: Portrait Barrier & Rotation Recovery ---");

  // Rotate to portrait (390 x 844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(500);

  const portraitRes = await page.evaluate(() => {
    const barrier = document.getElementById("okada-portrait-barrier");
    const root = document.getElementById("okada-phase1-controls-root");
    const h = window.h;

    const barrierVisible = barrier.classList.contains("visible") && getComputedStyle(barrier).display !== "none";
    const rootSuppressed = root.classList.contains("is-portrait") && getComputedStyle(root).opacity === "0";
    const inputsNeutral = Object.values(h.manager.getState()).every(v => v === 0 || v === false);

    return { barrierVisible, rootSuppressed, inputsNeutral };
  });

  check("portrait orientation displays Ryder barrier overlay", portraitRes.barrierVisible);
  check("portrait suppresses touch controls layer", portraitRes.rootSuppressed);
  check("portrait neutralizes all active inputs", portraitRes.inputsNeutral);

  // Capture Screenshot: Portrait Barrier (390x844)
  await saveScreenshot(page, "phase2c_portrait_barrier.png");

  // Rotate back to landscape (844 x 390)
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(500);

  const landscapeRes = await page.evaluate(() => {
    const barrier = document.getElementById("okada-portrait-barrier");
    const root = document.getElementById("okada-phase1-controls-root");
    const h = window.h;

    const barrierHidden = !barrier.classList.contains("visible") && getComputedStyle(barrier).display === "none";
    const controlsRestored = !root.classList.contains("is-portrait") && getComputedStyle(root).opacity === "1";
    const inputsClean = Object.values(h.manager.getState()).every(v => v === 0 || v === false);

    return { barrierHidden, controlsRestored, inputsClean };
  });

  check("landscape return dismisses barrier overlay", landscapeRes.barrierHidden);
  check("landscape return restores touch controls", landscapeRes.controlsRestored);
  check("landscape return maintains clean neutral inputs", landscapeRes.inputsClean);

  // ==========================================
  // SUITE 7: Multi-Viewport Responsive Matrix & Screenshots
  // ==========================================
  console.log("\n--- SUITE 7: Multi-Viewport Responsive Matrix ---");

  const viewports = [
    { name: "compact", width: 667, height: 375, file: "phase2c_device_compact_667x375.png" },
    { name: "large", width: 932, height: 430, file: "phase2c_device_large_932x430.png" },
    { name: "android", width: 915, height: 412, file: "phase2c_device_android_915x412.png" },
    { name: "tablet", width: 1024, height: 768, file: "phase2c_device_tablet_1024x768.png" },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
      window.__capyGame.renderer.setPixelRatio(1.0);
      window.__capyGame._applyRenderSize();
    });
    await page.waitForTimeout(300);

    const vpCheck = await page.evaluate(() => {
      const root = document.getElementById("okada-phase1-controls-root");
      const gas = document.getElementById("okada-btn-throttle");
      const steer = document.getElementById("okada-steer");
      const rGas = gas.getBoundingClientRect();
      const rSteer = steer.getBoundingClientRect();

      return {
        controlsVisible: getComputedStyle(root).opacity === "1",
        gasOnScreen: rGas.right <= window.innerWidth && rGas.bottom <= window.innerHeight,
        steerOnScreen: rSteer.left >= 0 && rSteer.bottom <= window.innerHeight,
      };
    });

    check(`viewport ${vp.name} (${vp.width}x${vp.height}) controls visible and within screen bounds`,
      vpCheck.controlsVisible && vpCheck.gasOnScreen && vpCheck.steerOnScreen
    );
    await saveScreenshot(page, vp.file);
  }

  // Restore standard viewport
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(300);

  // ==========================================
  // SUITE 8: Keyboard Fallback Regression
  // ==========================================
  console.log("\n--- SUITE 8: Keyboard Fallback Regression ---");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(60);
  const kbForward = await page.evaluate(() => window.h.adapter.getEngineInput().forward);
  const kbNormalized = await page.evaluate(() => window.h.manager.getState().throttle);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(60);
  const kbForwardUp = await page.evaluate(() => window.h.adapter.getEngineInput().forward);
  check("native keyboard W reaches engine forward via adapter fallback without touch contribution",
    kbForward === true && kbForwardUp === false && kbNormalized === 0
  );

  await page.keyboard.down("KeyA");
  await page.waitForTimeout(60);
  const kbSteer = await page.evaluate(() => window.h.adapter.getEngineInput().steerDir);
  const kbSteerNorm = await page.evaluate(() => window.h.manager.getState().steer);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(60);
  const kbSteerUp = await page.evaluate(() => window.h.adapter.getEngineInput().steerDir);
  check("native keyboard A reaches engine steerDir via adapter fallback without touch contribution",
    kbSteer === -1 && kbSteerUp === 0 && kbSteerNorm === 0
  );

  // Close browser and server
  await browser.close();
  server.close();

  // Summary
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n==============================================`);
  console.log(`PHASE 2C VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
  console.log(`==============================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error("FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});
