// Ryder Phase 2C-R1 — Mobile UX verification & screenshot suite.
//
// Corrected successor to the preserved Antigravity probe: it exercises the
// SHIPPED R1 implementation only. It does NOT test the rejected clock-pause hack,
// does NOT install duplicate store-motion wrappers, and does NOT emit synthetic
// keyboard events. The R3 store-motion policy is treated as frozen and is verified
// separately by scripts/test_store_motion*.mjs.
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

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".bin": "application/octet-stream" };
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
const out = path.join(tmp, "okada-input.js");
esbuild.buildSync({ entryPoints: [path.join(PKG, "src/lib/input/index.ts")], bundle: true, format: "iife", globalName: "OkadaInput", outfile: out, logLevel: "silent" });
const inputJs = fs.readFileSync(out, "utf8");

const results = [];
function check(name, ok, detail = "") { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); }
async function shot(page, name) { try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), timeout: 30000 }); console.log(`[screenshot] ${name}`); } catch (e) { console.warn(`[screenshot skip] ${name}: ${e.message}`); } }

async function main() {
  console.log("=== RYDER PHASE 2C-R1 MOBILE UX VERIFICATION ===");
  const actual = crypto.createHash("sha256").update(fs.readFileSync(BUNDLE)).digest("hex").toUpperCase();
  check("canonical bundle SHA-256 unchanged", actual === CANONICAL_SHA, actual);

  const server = await serve();
  const port = server.address().port;
  const browser = await pw.chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  page.setDefaultTimeout(180000);
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto(`http://127.0.0.1:${port}/capybara-game/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('[data-role="click"]'), null, { timeout: 180000 });
  await page.evaluate(() => { window.__capyGame.renderer.setPixelRatio(0.25); window.__capyGame._applyRenderSize(); });
  const r = await page.locator('[data-role="click"]').boundingBox();
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
  await page.waitForFunction(() => document.querySelectorAll(".capy-mbtn").length > 0, null, { timeout: 30000 });

  // Install input on the menu WITHOUT blocking on engine resolution (attach is immediate).
  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });
  await frame.evaluate(() => { window.hPromise = window.OkadaInput.initOkadaInput(window, document, { touchControls: true }); });
  await page.waitForTimeout(700);

  // ---- PART F/G/H: menu branding, sylens glass, SHOP ----
  const menu = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll(".capy-mbtn"));
    const shop = btns.find((b) => /shop/i.test(b.textContent || ""));
    const badge = document.getElementById("sylens-badge");
    const allText = document.body.innerText || "";
    const visibleVibejamImgs = Array.from(document.querySelectorAll("img")).filter((i) => {
      const s = getComputedStyle(i);
      return /vibe/i.test(i.src + " " + i.alt) && s.display !== "none" && s.visibility !== "hidden";
    });
    return {
      shopText: shop?.textContent?.trim(),
      shopIsRepurposed: !!shop?.classList.contains("ryder-shop-repurposed"),
      hasModal: !!document.getElementById("ryder-shop-modal"),
      badgeText: badge?.textContent, badgeClass: badge?.className,
      hasVibeJamText: /vibe\s?jam/i.test(allText),
      visibleVibejamImgs: visibleVibejamImgs.length,
    };
  });
  check("menu SHOP button present (Vibe Jam Portal repurposed)", menu.shopText === "SHOP" && menu.shopIsRepurposed, menu.shopText);
  check("no player-facing 'Vibe Jam' menu text", !menu.hasVibeJamText);
  check("no visible Vibe Jam award image", menu.visibleVibejamImgs === 0, `count=${menu.visibleVibejamImgs}`);
  check("sylens studios ™ signature text", menu.badgeText === "sylens studios ™", menu.badgeText);
  check("sylens liquid-glass class applied", menu.badgeClass === "sylens-liquid-glass", menu.badgeClass);
  check("SHOP modal shell exists", menu.hasModal);

  await shot(page, "r1_menu.png");
  await shot(page, "r1_sylens_glass.png");
  await shot(page, "r1_shop_button.png");

  const shopOpen = await page.evaluate(() => {
    const shop = Array.from(document.querySelectorAll(".capy-mbtn")).find((b) => /shop/i.test(b.textContent || ""));
    shop?.click();
    const modal = document.getElementById("ryder-shop-modal");
    return { visible: modal?.classList.contains("visible"), title: modal?.querySelector(".ryder-shop-title")?.textContent?.trim(), badge: modal?.querySelector(".ryder-shop-badge")?.textContent?.trim() };
  });
  check("SHOP opens shell on click", shopOpen.visible && shopOpen.title === "RYDER SHOP", JSON.stringify(shopOpen));
  await shot(page, "r1_shop_shell.png");
  const shopClosed = await page.evaluate(() => { document.getElementById("ryder-shop-close")?.click(); return !document.getElementById("ryder-shop-modal")?.classList.contains("visible"); });
  check("SHOP shell closes via CLOSE", shopClosed);

  // ---- Enter gameplay, resolve handle ----
  await page.getByRole('button', { name: /play offline/i }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await page.evaluate(() => { window.__capyGame.tutorial?.complete(); if (window.__capyGame.phone) window.__capyGame.phone._offersPaused = true; });
  await page.evaluate(async () => { window.h = await window.hPromise; });
  const hOk = await page.evaluate(() => !!window.h && !!window.__okadaInput);
  check("input handle resolves after Play (R3 lifecycle intact)", hOk);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => { window.__capyGame.renderer.setPixelRatio(1.0); window.__capyGame._applyRenderSize(); });
  await page.waitForTimeout(400);

  const controls = await page.evaluate(() => ({
    steer: !!document.getElementById("okada-steer"),
    walk: !!document.getElementById("okada-walk"),
    gas: !!document.getElementById("okada-btn-throttle"),
    brake: !!document.getElementById("okada-btn-brake"),
    rev: !!document.getElementById("okada-btn-reverse"),
    drift: !!document.getElementById("okada-btn-drift"),
    interact: !!document.getElementById("okada-btn-interact"),
    phone: !!document.getElementById("okada-btn-phone"),
    barrier: !!document.getElementById("okada-portrait-barrier"),
    root: !!document.getElementById("okada-phase1-controls-root"),
  }));
  check("driving control cluster present", controls.steer && controls.gas && controls.brake && controls.rev && controls.drift && controls.interact && controls.phone, JSON.stringify(controls));
  await shot(page, "r1_driving_idle.png");

  // ---- PART A: steering ----
  const steer = await page.evaluate(() => {
    const el = document.getElementById("okada-steer");
    const send = (type, id, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: "touch", isPrimary: id === 10 }));
    const h = window.h;
    send("pointerdown", 10, 140, 250);
    const hasCapture = h.touch.capturedPointers.size > 0;
    const owner = h.touch.steerOwner;
    send("pointermove", 10, 141, 250); const deadzone = h.manager.getState().steer; // +1px (< deadzone)
    send("pointermove", 10, 170, 250); const quarter = h.manager.getState().steer; // +30px => 0.5
    send("pointermove", 10, 200, 250); const full = h.manager.getState().steer; // +60px => 1.0
    send("pointermove", 10, 80, 250); const fullLeft = h.manager.getState().steer; // -60px => -1.0
    // second pointer must be rejected while owned
    send("pointerdown", 11, 50, 250); const secondRejected = h.touch.steerOwner === 10;
    send("pointerup", 10, 80, 250); const released = h.manager.getState().steer;
    send("pointerup", 11, 50, 250);
    // no double smoothing: same position twice yields same value; mapping is direct
    send("pointerdown", 12, 140, 250); send("pointermove", 12, 170, 250); const a = h.manager.getState().steer;
    send("pointermove", 12, 170, 250); const b = h.manager.getState().steer;
    send("pointerup", 12, 170, 250);
    return { hasCapture, owner, deadzone, quarter, full, fullLeft, secondRejected, released, a, b };
  });
  check("steering establishes dynamic origin + pointer capture", steer.hasCapture && steer.owner === 10, JSON.stringify({ cap: steer.hasCapture, owner: steer.owner }));
  check("steering deadzone suppresses micro-displacement", steer.deadzone === 0, String(steer.deadzone));
  check("steering fractional (30px -> 0.5)", Math.abs(steer.quarter - 0.5) < 1e-9, String(steer.quarter));
  check("steering full lock +1.0", steer.full === 1.0, String(steer.full));
  check("steering full lock -1.0", steer.fullLeft === -1.0, String(steer.fullLeft));
  check("second pointer rejected while steering owned", steer.secondRejected);
  check("steering release returns neutral 0", steer.released === 0);
  check("no double smoothing (same position idempotent)", steer.a === steer.b, JSON.stringify({ a: steer.a, b: steer.b }));

  await page.evaluate(() => {
    const el = document.getElementById("okada-steer");
    el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 21, bubbles: true, clientX: 150, clientY: 260, pointerType: "touch" }));
    el.dispatchEvent(new PointerEvent("pointermove", { pointerId: 21, bubbles: true, clientX: 195, clientY: 260, pointerType: "touch" }));
  });
  await shot(page, "r1_steering_active.png");
  await page.evaluate(() => document.getElementById("okada-steer").dispatchEvent(new PointerEvent("pointerup", { pointerId: 21, bubbles: true })));

  // ---- PART B: simultaneous actions ----
  const combo = await page.evaluate(async () => {
    const q = (id) => document.getElementById(id);
    const pd = (el, id) => el.dispatchEvent(new PointerEvent("pointerdown", { pointerId: id, bubbles: true, cancelable: true, clientX: 150, clientY: 260 }));
    const pu = (el, id) => el.dispatchEvent(new PointerEvent("pointerup", { pointerId: id, bubbles: true }));
    const h = window.h;
    // GAS + steer
    pd(q("okada-steer"), 30); q("okada-steer").dispatchEvent(new PointerEvent("pointermove", { pointerId: 30, bubbles: true, clientX: 180, clientY: 260 }));
    pd(q("okada-btn-throttle"), 31);
    const gasSteer = { steer: h.manager.getState().steer, throttle: h.manager.getState().throttle };
    // GAS + DRIFT + steer
    pd(q("okada-btn-drift"), 32);
    const gasDriftSteer = { steer: h.manager.getState().steer, throttle: h.manager.getState().throttle, drift: h.manager.getState().drift };
    await new Promise((r) => setTimeout(r, 50));
    pu(q("okada-btn-drift"), 32); pu(q("okada-btn-throttle"), 31); pu(q("okada-steer"), 30);
    // Brake + steer
    pd(q("okada-steer"), 33); q("okada-steer").dispatchEvent(new PointerEvent("pointermove", { pointerId: 33, bubbles: true, clientX: 180, clientY: 260 }));
    pd(q("okada-btn-brake"), 34);
    const brakeSteer = { steer: h.manager.getState().steer, brake: h.manager.getState().brake };
    pu(q("okada-btn-brake"), 34); pu(q("okada-steer"), 33);
    // Reverse + steer
    pd(q("okada-steer"), 35); q("okada-steer").dispatchEvent(new PointerEvent("pointermove", { pointerId: 35, bubbles: true, clientX: 180, clientY: 260 }));
    pd(q("okada-btn-reverse"), 36);
    const reverseSteer = { steer: h.manager.getState().steer, reverse: h.manager.getState().reverse };
    return { gasSteer, gasDriftSteer, brakeSteer, reverseSteer };
  });
  check("GAS + steering simultaneously", combo.gasSteer.throttle === 1 && combo.gasSteer.steer !== 0, JSON.stringify(combo.gasSteer));
  check("GAS + DRIFT + steering simultaneously", combo.gasDriftSteer.throttle === 1 && combo.gasDriftSteer.drift === true && combo.gasDriftSteer.steer !== 0, JSON.stringify(combo.gasDriftSteer));
  check("BRAKE + steering simultaneously", combo.brakeSteer.brake === 1 && combo.brakeSteer.steer !== 0, JSON.stringify(combo.brakeSteer));
  check("REVERSE + steering simultaneously", combo.reverseSteer.reverse === 1 && combo.reverseSteer.steer !== 0, JSON.stringify(combo.reverseSteer));

  await page.evaluate(() => {
    document.getElementById("okada-btn-throttle").dispatchEvent(new PointerEvent("pointerdown", { pointerId: 40, bubbles: true }));
    document.getElementById("okada-btn-drift").dispatchEvent(new PointerEvent("pointerdown", { pointerId: 41, bubbles: true }));
  });
  await shot(page, "r1_gas_drift.png");
  await page.evaluate(() => { document.getElementById("okada-btn-throttle").dispatchEvent(new PointerEvent("pointerup", { pointerId: 40, bubbles: true })); document.getElementById("okada-btn-drift").dispatchEvent(new PointerEvent("pointerup", { pointerId: 41, bubbles: true })); });

  // ---- PART D: mute (single canonical toggle; no duplicate wiring) ----
  const mute = await page.evaluate(() => {
    const btn = document.getElementById("btn-mute");
    const before = window.__capyAudio?.isMuted?.();
    btn?.click();
    const after = window.__capyAudio?.isMuted?.();
    const on = document.getElementById("btn-mute-on"), off = document.getElementById("btn-mute-off");
    const iconSynced = after ? off?.style.display !== "none" : on?.style.display !== "none";
    btn?.click();
    const restored = window.__capyAudio?.isMuted?.();
    return { before, after, iconSynced, restored };
  });
  check("mute toggles audible state exactly once per tap", mute.after !== mute.before, JSON.stringify({ before: mute.before, after: mute.after }));
  check("mute icon syncs with audible state", mute.iconSynced);
  check("unmute restores audible state", mute.restored === mute.before);
  await shot(page, "r1_mute.png");

  // ---- PART C: orientation (stub screen.orientation for headless determinism) ----
  const portrait = await page.evaluate(async () => {
    try { Object.defineProperty(screen.orientation, "type", { configurable: true, get: () => "portrait-primary" }); } catch { /* ignore */ }
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("orientationchange"));
    await new Promise((r) => setTimeout(r, 120));
    const barrier = document.getElementById("okada-portrait-barrier");
    const h = window.h;
    return { visible: barrier?.classList.contains("visible"), rootPortrait: document.getElementById("okada-phase1-controls-root")?.classList.contains("is-portrait"), steer: h.manager.getState().steer, throttle: h.manager.getState().throttle };
  });
  check("portrait signal raises full-screen barrier", portrait.visible && portrait.rootPortrait, JSON.stringify(portrait));
  check("portrait neutralizes gameplay input", portrait.steer === 0 && portrait.throttle === 0);
  await shot(page, "r1_portrait.png");

  const landscape = await page.evaluate(async () => {
    try { Object.defineProperty(screen.orientation, "type", { configurable: true, get: () => "landscape-primary" }); } catch { /* ignore */ }
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("orientationchange"));
    await new Promise((r) => setTimeout(r, 120));
    const barrier = document.getElementById("okada-portrait-barrier");
    return { hidden: !barrier?.classList.contains("visible"), steer: window.h.manager.getState().steer };
  });
  check("landscape recovery hides barrier without reload", landscape.hidden, JSON.stringify(landscape));

  await browser.close();
  server.close();

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\nTOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed} | FAILED: ${failed}`);
  if (failed > 0) { console.error("FAILURES DETECTED IN PHASE 2C-R1 VERIFICATION"); process.exit(1); }
  console.log("ALL PHASE 2C-R1 MOBILE UX CHECKS PASSED");
}
main().catch((e) => { console.error("Fatal verification error:", e); process.exit(1); });
