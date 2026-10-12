// Automated Phase-1 verification.
// 1) canonical hash, 2) parse, 3) boot, 4) input API, 5) steering/brake/reverse/walk/release.
// Bundles the REAL src/lib/input modules with esbuild and runs them inside the game iframe.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
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

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex").toUpperCase();
}

// 1. canonical hash + size
const raw = fs.readFileSync(BUNDLE);
check("canonical SHA-256", sha256(raw) === CANONICAL_SHA, sha256(raw));
check("canonical size", raw.length === CANONICAL_SIZE, String(raw.length));

// 2. parse (acorn + esbuild)
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
function serve(port) { return new Promise((res) => { const s = require("node:http").createServer((req, r) => { let u = decodeURIComponent((req.url || "/").split("?")[0]); if (u === "/") u = "/capybara-game/index.html"; const fp = path.resolve(path.join(PKG, "public"), "." + u); if (!fp.startsWith(path.resolve(path.join(PKG, "public")) + path.sep)) { r.writeHead(403); r.end(); return; } fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" }); r.end(d); }); }); s.listen(port, "127.0.0.1", () => res(s)); }); }

async function main() {
  await serve(4201);
  const browser = await pw.chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:4201/capybara-game/index.html", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForFunction(() => typeof window.__capyGame !== "undefined", { timeout: 120000, polling: 500 }).catch(() => {});
  await page.evaluate(() => window.__capyGame.start()).catch(() => {});
  await page.waitForTimeout(2000);

  // boot globals
  const boot = await page.evaluate(() => ({
    capyGame: typeof window.__capyGame !== "undefined",
    capyAudio: typeof window.__capyAudio !== "undefined",
    three: typeof window.__THREE__ !== "undefined",
  }));
  check("boot __capyGame", boot.capyGame);
  check("boot __capyAudio", boot.capyAudio);
  check("boot __THREE__", boot.three);

  // inject the real bundled input system into the game document (loaded as the main frame here)
  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });

  const handle = await frame.evaluate(async () => {
    const OkadaInput = window.OkadaInput;
    if (!OkadaInput) return { error: "no OkadaInput global" };
    const h = await OkadaInput.initOkadaInput(window, document, { touchControls: false, gamepad: false });
    return { resolved: !!h, hasState: !!h?.manager?.getState };
  });
  check("initOkadaInput resolved", handle.resolved === true, JSON.stringify(handle));

  // steering readback through the engine input object
  const steering = await frame.evaluate(async () => {
    const m = window.__okadaInput.manager;
    const adapter = window.__okadaInput.adapter;
    const rC = adapter.getEngineInput();
    const vals = [-1, -0.5, -0.1, 0, 0.1, 0.35, 0.5, 1];
    const out = {};
    for (const v of vals) {
      m.apply("touch", { steer: v });
      out[String(v)] = rC.steerDir;
    }
    m.apply("touch", { steer: 0 });
    return out;
  });
  const steerOk = Object.entries(steering).every(([k, v]) => Math.abs(Number(k) - Number(v)) < 1e-9);
  check("steering fractional readback (-1..1)", steerOk, JSON.stringify(steering));

  // brake vs reverse independence
  const brakeRev = await frame.evaluate(() => {
    const m = window.__okadaInput.manager;
    const rC = window.__okadaInput.adapter.getEngineInput();
    m.apply("touch", { brake: 1 });
    const brake = { brake: rC.brake, backward: rC.backward, forward: rC.forward };
    m.apply("touch", { reverse: 1 });
    const rev = { brake: rC.brake, backward: rC.backward, forward: rC.forward };
    m.apply("touch", { throttle: 1 });
    const thr = { brake: rC.brake, backward: rC.backward, forward: rC.forward };
    m.reset();
    return { brake, rev, thr };
  });
  check("brake independent (brake true, backward false)", brakeRev.brake.brake === true && brakeRev.brake.backward === false, JSON.stringify(brakeRev.brake));
  check("reverse distinct (backward true, brake false)", brakeRev.rev.backward === true && brakeRev.rev.brake === false, JSON.stringify(brakeRev.rev));
  check("throttle forward (forward true)", brakeRev.thr.forward === true, JSON.stringify(brakeRev.thr));

  // walking non-cardinal vector
  const walk = await frame.evaluate(() => {
    const m = window.__okadaInput.manager;
    const rC = window.__okadaInput.adapter.getEngineInput();
    m.apply("touch", { walkX: 0.42, walkY: -0.71 });
    const v = rC.walkVec;
    m.reset();
    return v;
  });
  check("walk non-cardinal vector (x=0.42, z=0.71)", !!walk && walk.active && Math.abs(walk.x - 0.42) < 1e-9 && Math.abs(walk.z - 0.71) < 1e-9, JSON.stringify(walk));

  // release/reset safety: everything neutral after reset
  const release = await frame.evaluate(() => {
    const m = window.__okadaInput.manager;
    const rC = window.__okadaInput.adapter.getEngineInput();
    m.apply("touch", { steer: 0.8, throttle: 1, brake: 1, reverse: 1, drift: true, interact: true, walkX: 0.5, walkY: 0.5 });
    m.reset();
    const s = m.getState();
    const neutral = s.steer === 0 && s.throttle === 0 && s.brake === 0 && s.reverse === 0 && !s.drift && !s.interact && s.walkX === 0 && s.walkY === 0;
    return { neutral, steerReadback: rC.steerDir };
  });
  check("release/reset neutralizes all inputs", release.neutral === true, JSON.stringify(release));

  await browser.close();
  summary();
}

function summary() {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n===== VERIFY SUMMARY: ${pass} pass, ${fail} fail =====`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("VERIFY FAILURE", e); process.exit(1); });
