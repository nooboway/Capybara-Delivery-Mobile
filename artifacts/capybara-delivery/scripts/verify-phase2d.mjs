// Ryder Phase 2D — immersive shell, final controls, copy audit verification.
//
// Static: canonical SHA, PWA manifest + mobile metadata, copy hygiene.
// Runtime: 360° floating joystick (dynamic origin, circular gate), combined
// BRAKE/REVERSE state machine with hysteresis, fullscreen capability surface.
// R3 store-motion is verified separately and treated as frozen.
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
const SCREENSHOT_DIR = path.resolve(REPO, "docs/ux/screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const esbuild = require(path.join(REPO, "node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild"));
const pw = require("C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".bin": "application/octet-stream" };
function serve() {
  return new Promise((res, rej) => {
    const s = http.createServer((req, r) => {
      let u = decodeURIComponent((req.url || "/").split("?")[0]);
      if (u === "/") u = "/capybara-game/index.html";
      const root = path.resolve(path.join(PKG, "public"));
      const fp = path.resolve(root, "." + u);
      if (!fp.startsWith(root + path.sep)) { r.writeHead(403); r.end(); return; }
      fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" }); r.end(d); });
    });
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => res(s));
  });
}

const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "okada-input-p2d.js");
esbuild.buildSync({ entryPoints: [path.join(PKG, "src/lib/input/index.ts")], bundle: true, format: "iife", globalName: "OkadaInput", outfile: out, logLevel: "silent" });
const inputJs = fs.readFileSync(out, "utf8");

const results = [];
function check(name, ok, detail = "") { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); }
async function shot(page, name) { try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), timeout: 30000 }); console.log(`[screenshot] ${name}`); } catch (e) { console.warn(`[screenshot skip] ${name}: ${e.message}`); } }

async function main() {
  console.log("=== RYDER PHASE 2D VERIFICATION ===");

  // ---- Static gates ----
  const actual = crypto.createHash("sha256").update(fs.readFileSync(BUNDLE)).digest("hex").toUpperCase();
  check("canonical bundle SHA-256 unchanged", actual === CANONICAL_SHA, actual);

  const manifestPath = path.join(PKG, "public", "manifest.webmanifest");
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); } catch { /* missing */ }
  check("PWA manifest present and valid", !!manifest, manifestPath);
  if (manifest) {
    check("manifest display fullscreen + orientation landscape", manifest.display === "fullscreen" && manifest.orientation === "landscape", `${manifest.display}/${manifest.orientation}`);
    check("manifest name/short_name are Ryder", /^Ryder\b/.test(manifest.name || "") && manifest.short_name === "Ryder", manifest.short_name);
    check("manifest theme+background colour set", !!manifest.theme_color && !!manifest.background_color, `${manifest.theme_color}`);
    check("manifest has icons", Array.isArray(manifest.icons) && manifest.icons.length > 0);
  }
  const shellHtml = fs.readFileSync(path.join(PKG, "index.html"), "utf8");
  check("shell links manifest + theme-color", /rel="manifest"/.test(shellHtml) && /name="theme-color"/.test(shellHtml));
  check("shell has apple-mobile-web-app-capable", /apple-mobile-web-app-capable/.test(shellHtml));

  const gameHtml = fs.readFileSync(path.join(PKG, "public", "capybara-game", "index.html"), "utf8");
  check("game links manifest + apple metadata", /rel="manifest"/.test(gameHtml) && /apple-mobile-web-app-capable/.test(gameHtml));
  check("subtitle uses Animals (no Capybaras)", /Ryder - A Game About Animals Delivering Food/.test(gameHtml) && !/Capybaras Delivering Food/.test(gameHtml));
  check("embed bar uses Ryder branding (no Okada)", /embed-bar-title">Ryder - A Game About Animals Delivering Food/.test(gameHtml) && !/>Okada -/.test(gameHtml));

  const server = await serve();
  const port = server.address().port;
  const browser = await pw.chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  page.setDefaultTimeout(180000);
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto(`http://127.0.0.1:${port}/capybara-game/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('[data-role="click"]'), null, { timeout: 180000 });

  // fullscreen capability surface (engage itself requires a real user gesture)
  const fsCap = await page.evaluate(() => ({
    enabled: "fullscreenEnabled" in document,
    request: typeof document.documentElement.requestFullscreen === "function",
    orientationLock: !!(screen.orientation && typeof screen.orientation.lock === "function"),
  }));
  check("fullscreen capability detected (enabled/request)", fsCap.enabled && fsCap.request, JSON.stringify(fsCap));

  await page.evaluate(() => { window.__capyGame.renderer.setPixelRatio(0.25); window.__capyGame._applyRenderSize(); });
  let box = await page.locator('[data-role="click"]').boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByRole('button', { name: /play offline/i }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await page.evaluate(() => { window.__capyGame.tutorial?.complete(); if (window.__capyGame.phone) window.__capyGame.phone._offersPaused = true; });

  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });
  await frame.evaluate(async () => { window.h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true }); });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => { window.__capyGame.renderer.setPixelRatio(1.0); window.__capyGame._applyRenderSize(); });
  await page.waitForTimeout(400);
  await shot(page, "r2d_driving_idle.png");

  // ---- Joystick: dynamic origin, circular gate, vertical ignored ----
  const stick = await page.evaluate(() => {
    const el = document.getElementById("okada-steer");
    const ring = el.querySelector(".stick-ring");
    const send = (type, id, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: "touch", isPrimary: id === 60 }));
    const h = window.h;
    send("pointerdown", 60, 200, 250);
    const originSet = ring && ring.style.left !== "" && el.classList.contains("active");
    const atDown = h.manager.getState().steer;
    send("pointermove", 60, 200, 170); // vertical only
    const verticalOnly = h.manager.getState().steer;
    send("pointermove", 60, 260, 250); // +60 horizontal -> full lock
    const fullRight = h.manager.getState().steer;
    send("pointermove", 60, 200 + 90, 250 + 90); // beyond ring radius (diagonal)
    const clamped = h.manager.getState().steer;
    send("pointerup", 60, 260, 250);
    const released = h.manager.getState().steer;
    const inactive = !el.classList.contains("active");
    return { originSet, atDown, verticalOnly, fullRight, clamped, released, inactive };
  });
  check("joystick dynamic origin appears at touch point", stick.originSet, JSON.stringify({ origin: stick.originSet }));
  check("joystick steer is 0 at touch-down (dynamic origin)", stick.atDown === 0);
  check("vertical thumb movement does NOT steer the bike", stick.verticalOnly === 0, String(stick.verticalOnly));
  check("horizontal full throw = +1.0", stick.fullRight === 1.0, String(stick.fullRight));
  check("circular gate clamps steer to +1.0 beyond radius", stick.clamped === 1.0, String(stick.clamped));
  check("joystick release returns neutral 0", stick.released === 0);
  check("joystick hides on release", stick.inactive);

  await page.evaluate(() => {
    const el = document.getElementById("okada-steer");
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 61, bubbles: true, clientX: 180, clientY: 260, pointerType: "touch" }));
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 61, bubbles: true, clientX: 225, clientY: 220, pointerType: "touch" }));
  });
  await shot(page, "r2d_joystick_active.png");
  await page.evaluate(() => document.getElementById("okada-steer").dispatchEvent(new PointerEvent("pointerup", { pointerId: 61, bubbles: true })));

  // ---- Combined BRAKE / REVERSE state machine ----
  await page.keyboard.down("w");
  let speedBefore = 0;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(300);
    speedBefore = await page.evaluate(() => window.__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed);
    if (speedBefore > 1.2) break;
  }
  await page.keyboard.up("w");
  check("combined control precondition: bike moving forward", speedBefore > 0.5, String(speedBefore.toFixed(3)));

  const combo = await page.evaluate(async () => {
    const btn = document.getElementById("okada-btn-brake");
    const h = window.h;
    const dynamics = () => window.__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed;
    const speedAtPress = +dynamics().toFixed(3);
    btn.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 70, bubbles: true, cancelable: true }));
    const immediate = { brake: h.manager.getState().brake, reverse: h.manager.getState().reverse };
    const samples = [];
    for (let i = 0; i < 44; i++) {
      await new Promise((r) => setTimeout(r, 60));
      const s = h.manager.getState();
      samples.push({ brake: s.brake, reverse: s.reverse, speed: +dynamics().toFixed(3) });
    }
    btn.dispatchEvent(new PointerEvent("pointerup", { pointerId: 70, bubbles: true }));
    const after = h.manager.getState();
    return { speedAtPress, immediate, samples, after: { brake: after.brake, reverse: after.reverse } };
  });
  const firstReverseIdx = combo.samples.findIndex((s) => s.reverse === 1);
  const flicker = combo.samples.slice(firstReverseIdx + 1).some((s) => s.reverse === 0 && s.brake === 1);
  const neverBoth = combo.samples.every((s) => !(s.brake === 1 && s.reverse === 1));
  check("combined control brakes while moving forward", combo.speedAtPress > 0.15 && combo.immediate.brake === 1 && combo.immediate.reverse === 0, JSON.stringify({ speedAtPress: combo.speedAtPress, immediate: combo.immediate }));
  check("combined control transitions to reverse once stopped", firstReverseIdx >= 0, `firstReverse@${firstReverseIdx}`);
  check("combined control is hysteretic (no brake/reverse flicker)", !flicker);
  check("brake and reverse are never active simultaneously", neverBoth);
  check("combined control release neutralizes", combo.after.brake === 0 && combo.after.reverse === 0, JSON.stringify(combo.after));
  await shot(page, "r2d_brake_reverse.png");

  // At rest the combined control offers reverse directly.
  await page.waitForTimeout(2600);
  const restPress = await page.evaluate(async () => {
    const btn = document.getElementById("okada-btn-brake");
    btn.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 71, bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 80));
    const s = window.h.manager.getState();
    btn.dispatchEvent(new PointerEvent("pointerup", { pointerId: 71, bubbles: true }));
    return { brake: s.brake, reverse: s.reverse };
  });
  check("combined control at rest selects reverse", restPress.reverse === 1 && restPress.brake === 0, JSON.stringify(restPress));

  // ---- Store 360° walking (dynamic origin, full vector) ----
  await page.evaluate(() => { window.__capyGame._onOrderAccepted({}); window.__capyGame._pendingStoreItems = ["Bubble Milk Tea"]; window.__capyGame.setMode("store"); });
  await page.waitForFunction(() => document.body.classList.contains("in-store-mode"), null, { timeout: 10000 });
  await page.waitForTimeout(400);
  const walk = await page.evaluate(() => {
    const el = document.getElementById("okada-walk");
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const send = (type, id, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: "touch", isPrimary: id === 80 }));
    send("pointerdown", 80, cx, cy);
    send("pointermove", 80, cx + 40, cy - 40);
    const s = window.h.manager.getState();
    send("pointerup", 80, cx + 40, cy - 40);
    const after = window.h.manager.getState();
    return { walkX: s.walkX, walkY: s.walkY, afterX: after.walkX, afterY: after.walkY };
  });
  check("store joystick diagonal walking (walkX>0, walkY>0)", walk.walkX > 0 && walk.walkY > 0, JSON.stringify(walk));
  check("store joystick release neutralizes", walk.afterX === 0 && walk.afterY === 0);
  await shot(page, "r2d_store_walk.png");
  await page.evaluate(() => window.__capyGame.setMode("world"));
  await page.waitForTimeout(300);

  // ---- Phone open neutralizes driving; close restores ----
  const phoneFlow = await page.evaluate(async () => {
    const phone = window.__capyGame.phone;
    const h = window.h;
    h.manager.apply("touch", { throttle: 1 });
    const beforeOpen = h.manager.getState().throttle;
    phone.show();
    await new Promise((r) => setTimeout(r, 150));
    const openState = h.manager.getState().throttle;
    phone.hide();
    await new Promise((r) => setTimeout(r, 150));
    const afterClose = h.manager.getState().throttle;
    return { beforeOpen, openState, afterClose, visible: phone.visible };
  });
  check("phone open neutralizes driving input", phoneFlow.beforeOpen === 1 && phoneFlow.openState === 0, JSON.stringify(phoneFlow));
  check("phone close keeps controls neutral (no stale input)", phoneFlow.afterClose === 0);

  await browser.close();
  server.close();

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\nTOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed} | FAILED: ${failed}`);
  if (failed > 0) { console.error("FAILURES DETECTED IN PHASE 2D VERIFICATION"); process.exit(1); }
  console.log("ALL PHASE 2D CHECKS PASSED");
}
main().catch((e) => { console.error("Fatal verification error:", e); process.exit(1); });
