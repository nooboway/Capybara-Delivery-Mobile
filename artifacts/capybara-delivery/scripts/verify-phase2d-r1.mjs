// Ryder Phase 2D-R1 — physical mobile regression verification.
// Covers: P0-A menu visibility, P0-B phone/menu overlap, P0-C phone touch priority
// (Capy Food), P0-D real mute. Uses the REAL src/lib/input bundle in a headless
// browser against the canonical engine bundle (SHA unchanged).
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

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".bin": "application/octet-stream" };
function serve() { return new Promise((res) => { const s = http.createServer((req, r) => { let u = decodeURIComponent((req.url || "/").split("?")[0]); if (u === "/harness") { r.writeHead(200, {"Content-Type":"text/html"}); r.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style><iframe src="/capybara-game/index.html" allow="autoplay; fullscreen"></iframe>'); return; } if (u === "/") u = "/capybara-game/index.html"; const root = path.resolve(path.join(PKG, "public")); const fp = path.resolve(root, "." + u); if (!fp.startsWith(root + path.sep)) { r.writeHead(403); r.end(); return; } fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" }); r.end(d); }); }); s.listen(0, "127.0.0.1", () => res(s)); }); }

const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "okada-input-r1.js");
esbuild.buildSync({ entryPoints: [path.join(PKG, "src/lib/input/index.ts")], bundle: true, format: "iife", globalName: "OkadaInput", outfile: out, logLevel: "silent" });
const inputJs = fs.readFileSync(out, "utf8");

const results = [];
function check(name, ok, detail = "") { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); }
const overlaps = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);

let cleanup = async () => {};
async function main() {
  console.log("=== RYDER PHASE 2D-R1 PHYSICAL REGRESSION ===");
  const actual = crypto.createHash("sha256").update(fs.readFileSync(BUNDLE)).digest("hex").toUpperCase();
  check("canonical bundle SHA-256 unchanged", actual === CANONICAL_SHA, actual);

  const server = await serve();
  const port = server.address().port;
  const browser = await pw.chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  cleanup = async () => { await browser.close(); await new Promise(resolve=>server.close(resolve)); };
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await page.addInitScript(() => {
    window.__playedMedia = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!window.__playedMedia.includes(this)) window.__playedMedia.push(this);
      this.__plays = (this.__plays || 0) + 1;
      window.__lastPlayedMedia = this;
      return play.apply(this, arguments);
    };
  });
  page.setDefaultTimeout(180000);
  const runtimeErrors=[];
  page.on("pageerror", (e) => { runtimeErrors.push(e.stack || e.message); if(runtimeErrors.length<=2)console.log("[pageerror]",e.stack || e.message); });

  await page.goto(`http://127.0.0.1:${port}/harness`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const frame = page.frames().find(f => f !== page.mainFrame());
  await frame.waitForFunction(() => window.__capyGame && document.querySelector('[data-role="click"]'), null, {timeout:180000});
  await frame.evaluate(() => { window.__capyGame.renderer.setPixelRatio(.25); window.__capyGame._applyRenderSize(); });
  await frame.addScriptTag({content:inputJs});
  await frame.evaluate(() => { window.__initPromise = window.OkadaInput.initOkadaInput(window, document, {touchControls:true}); });
  const shotDir = process.env.RYDER_SCREENSHOT_DIR || path.join(REPO, "docs/ux/screenshots");
  fs.mkdirSync(shotDir, { recursive: true });
  const shot = name => page.screenshot({path:path.join(shotDir, `p2d_r1_${name}.png`)});
  const tap = async selector => {
    await frame.locator(selector).scrollIntoViewIfNeeded();
    const box = await frame.locator(selector).boundingBox();
    if (!box) throw new Error(`No hit target: ${selector}`);
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(200);
  };
  // Phase 2E keeps the shared Phone/Menu/Mute HUD usable while Phone is open;
  // all gameplay surfaces, including every nested label/puck, remain blocked.
  const blockedAudit = () => [...document.querySelectorAll('[data-ryder-gameplay], [data-ryder-gameplay] *')].every(el => {
    const css = getComputedStyle(el); return css.pointerEvents === "none" && css.visibility === "hidden";
  });
  check("A: every gameplay descendant hidden and disabled before gameplay", await frame.evaluate(blockedAudit));
  await shot("menu");
  // ==== TEST A: menu (not in-game) — controls hidden + non-hit-testable ====
  const menuState = await frame.evaluate(() => {
    const inGame = document.body.classList.contains("in-game");
    const root = document.getElementById("okada-phase1-controls-root");
    const vis = (id) => { const el = document.getElementById(id); if (!el) return "absent"; const cs = getComputedStyle(el); return { display: cs.display, opacity: cs.opacity, visibility: cs.visibility, pe: cs.pointerEvents }; };
    return { inGame, notInGame: root?.classList.contains("not-in-game"), steer: vis("okada-steer"), gas: vis("okada-btn-throttle"), phone: vis("okada-btn-phone") };
  });
  check("A: not-in-game (menu) — root has not-in-game class", menuState.inGame === false && menuState.notInGame === true, JSON.stringify(menuState));
  check("A: menu controls not hit-testable (pointer-events none)", menuState.steer.pe === "none" && menuState.gas.pe === "none" && menuState.phone.pe === "none", JSON.stringify({ steer: menuState.steer.pe, gas: menuState.gas.pe, phone: menuState.phone.pe }));
  check("A: menu controls invisible (visibility hidden)", menuState.steer.visibility === "hidden" && menuState.gas.visibility === "hidden" && menuState.phone.visibility === "hidden", JSON.stringify({ steerVis: menuState.steer.visibility, gasVis: menuState.gas.visibility, phoneVis: menuState.phone.visibility }));

  // ==== Boot into gameplay (real menu flow) ====
  console.log("[boot] startup tap");
  const r = await frame.locator('[data-role="click"]').boundingBox();
  await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
  console.log('[boot] offline');
  await frame.getByRole('button', { name: /play offline/i }).click();
  console.log('[boot] Play');
  await frame.getByRole('button', { name: 'Play', exact: true }).click();
  console.log('[boot] wait gameplay');
  await frame.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await frame.evaluate(() => { window.__capyGame.tutorial?.complete(); if (window.__capyGame.phone) window.__capyGame.phone._offersPaused = true; });
  // Use the original pre-game initialization, exactly as the React shell does.
  // Reinitializing here used to conceal the 60-second startup timeout defect.
  console.log("[boot] await original adapter");
  await frame.evaluate(async () => { window.h = await window.__initPromise; });
  await frame.waitForFunction(() => window.h != null && window.h.manager != null, null, { timeout: 30000 });
  // Keep normal Chromium rendering. Forced --disable-gpu reproduces a canonical
  // Rapier trap even with all Ryder integration absent; do not alter simulation.
  await frame.evaluate(() => {
    window.__qaPhysicsFrames = 0;
    const world = window.__capyGame.world, step = world._stepPhysics;
    world._stepPhysics = function (...args) {
      const result = step.apply(this, args);
      window.__qaPhysicsFrames++;
      return result;
    };
  });
  const stableFrames = async label => {
    const start = await frame.evaluate(() => window.__qaPhysicsFrames);
    const started = Date.now();
    await frame.waitForFunction(target => window.__qaPhysicsFrames >= target, start + 1200, {timeout:180000});
    console.log('STABILITY', label, JSON.stringify({frames:(await frame.evaluate(()=>window.__qaPhysicsFrames))-start,elapsedMs:Date.now()-started,runtimeErrors:runtimeErrors.length}));
    if(runtimeErrors.length) throw new Error(`${label}: runtime errors during 1,200-frame stability verification`);
  };
  await stableFrames('idle');
  await page.setViewportSize({ width: 844, height: 390 });
  await frame.evaluate(() => { window.__capyGame.renderer.setPixelRatio(.25); window.__capyGame._applyRenderSize(); });
  await page.waitForTimeout(300);

  // ==== TEST B: in-game — controls visible ====
  const worldState = await frame.evaluate(() => {
    const root = document.getElementById("okada-phase1-controls-root");
    const vis = (id) => { const el = document.getElementById(id); if (!el) return "absent"; const cs = getComputedStyle(el); return { display: cs.display, opacity: cs.opacity, pe: cs.pointerEvents }; };
    return { notInGame: root?.classList.contains("not-in-game"), steer: vis("okada-steer"), gas: vis("okada-btn-throttle"), phone: vis("okada-btn-phone") };
  });
  check("B: in-game — controls visible (opacity 1, pointer-events auto)", worldState.notInGame === false && worldState.gas.opacity === "1" && worldState.gas.pe === "auto", JSON.stringify(worldState));

  // ==== TEST C: phone/menu button geometric separation (multiple viewports) ====
  for (const [w, h] of [[844, 390], [780, 360], [740, 360], [667, 375], [932, 430], [915, 412]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(100);
    const geom = await frame.evaluate(() => {
      const r = (id) => { const el = document.getElementById(id); if (!el) return null; const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width }; };
      return { phone: r("okada-btn-phone"), menu: r("btn-menu"), mute: r("btn-mute") };
    });
    const phoneMenuOk = geom.phone && geom.menu && geom.menu.w > 0 && !overlaps(geom.phone, geom.menu);
    const phoneMuteOk = geom.phone && geom.mute && geom.mute.w > 0 && !overlaps(geom.phone, geom.mute);
    check(`C: phone/menu/mute no overlap @ ${w}x${h}`, phoneMenuOk && phoneMuteOk && Math.abs(geom.menu.l - geom.phone.r - 8) < 1 && Math.abs(geom.menu.t - geom.phone.t) < 1, JSON.stringify(geom));
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);

  await shot("hud");
  // Trusted multi-touch: steering + held GAS, then Phone. Phase 2E removes GAS lock.
  // CDP coordinates refer
  // to the parent viewport; this harness has an actual full-size game iframe.
  const cdp = await page.context().newCDPSession(page);
  const touches = async points => cdp.send("Input.dispatchTouchEvent", {type:points.length ? "touchMove" : "touchEnd", touchPoints:points});
  const center = async selector => { const b=await frame.locator(selector).boundingBox(); return {x:b.x+b.width/2,y:b.y+b.height/2}; };
  const gas=await center('#okada-btn-throttle');
  const steer=await center('#okada-steer');
  await cdp.send("Input.dispatchTouchEvent", {type:"touchStart",touchPoints:[{id:1,...steer},{id:2,...gas}]});
  await touches([{id:1,x:steer.x+35,y:steer.y-20},{id:2,...gas}]);
  await page.waitForTimeout(1300);
  const active = await frame.evaluate(() => ({s:window.h.manager.getState(),locked:window.h.touch.isGasLocked}));
  check("D: trusted multitouch acquires steering and held GAS without latching", active.s.steer > 0 && active.s.throttle === 1 && !active.locked, JSON.stringify(active));
  await touches([]);
  console.log('[phone-before]',await frame.evaluate(()=>{const b=document.querySelector('#okada-btn-phone').getBoundingClientRect();return {visible:window.__capyGame.phone.visible,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.outerHTML.slice(0,200)};}));
  await frame.evaluate(()=>{window.__phoneEvents=[];for(const kind of ['pointerdown','pointerup','click'])document.addEventListener(kind,e=>window.__phoneEvents.push({kind,trusted:e.isTrusted,id:e.target.id}),true);});
  await tap('#okada-btn-phone');
  console.log('[phone-after]',await frame.evaluate(()=>({visible:window.__capyGame.phone.visible,events:window.__phoneEvents})));
  await frame.waitForFunction(() => window.__capyGame.phone.visible,null,{timeout:5000});
  const released = await frame.evaluate(() => ({s:window.h.manager.getState(),lock:window.h.touch.isGasLocked,steer:window.h.touch.steerOwner,walk:window.h.touch.walkOwner,captures:window.h.touch.capturedPointers.size,owners:[...window.h.touch.buttonOwners.values()].reduce((n,v)=>n+v.size,0)}));
  check("D: Phone clears movement, GAS lock and every pointer owner", released.s.throttle===0 && released.s.steer===0 && !released.lock && released.steer===null && released.walk===null && released.captures===0 && released.owners===0, JSON.stringify(released));
  check("D: Phone disables every gameplay descendant",await frame.evaluate(blockedAudit));
  // Unlock is a setup fixture; Phone opening and app/order/close taps below are
  // trusted browser input, with no programmatic dispatch/click bypass.
  await frame.evaluate(() => {if(window.__capyGame.phone.locked) window.__capyGame.phone.unlock();});
  await page.waitForTimeout(1000);
  await shot("phone_home");
  for(const [width,height] of [[780,360],[667,375],[844,390]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(150);
    const layout=await frame.evaluate(()=>{const icon=document.querySelector('.app-icon[data-app="capyfood"]'),b=icon.getBoundingClientRect(),p=document.querySelector('#phone-hud .phone-frame').getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {w:b.width,h:b.height,bottom:p.bottom,view:innerHeight,hit:!!hit?.closest('.app-icon[data-app="capyfood"]')};});
    check(`E: landscape Phone fits and Capy Food is tappable @ ${width}x${height}`,layout.w>=44 && layout.h>=44 && layout.hit && layout.bottom<=layout.view,JSON.stringify(layout));
  }
  const capy = await frame.evaluate(() => {
    const el=document.querySelector('.app-icon[data-app="capyfood"]'); const b=el.getBoundingClientRect();
    const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
    return {w:b.width,h:b.height,bottom:b.bottom,hit:!!hit?.closest('.app-icon[data-app="capyfood"]'),height:innerHeight};
  });
  check("E: Capy Food is a real unobstructed landscape hit target",capy.hit && capy.w>=44 && capy.h>=44 && capy.bottom<=capy.height,JSON.stringify(capy));
  await tap('.app-icon[data-app="capyfood"]');
  check("E: trusted touch opens Capy Food",await frame.evaluate(() => window.__capyGame.phone.currentApp==='capyfood'));
  await frame.evaluate(() => {
    const p=window.__capyGame.phone; p.online=true; p._offersPaused=false; p._tryFireOffer(); p._offersPaused=true; p.offerTimer=10000;
  });
  await page.waitForTimeout(500);
  await shot("offer");
  await frame.locator('.btn-offer-accept').scrollIntoViewIfNeeded();
  check("E: scrolled Accept is unobstructed and touch-sized",await frame.evaluate(()=>{const e=document.querySelector('.btn-offer-accept'),b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.height>=44 && b.bottom<=innerHeight && (hit===e || e.contains(hit));}));
  await shot("accept_target");
  await tap('.btn-offer-accept');
  const accepted=await frame.evaluate(() => ({active:!!window.__capyGame.phone.activeOrder,phase:window.__capyGame.phone.phase}));
  check("E: trusted Accept activates canonical order",accepted.active && accepted.phase==='drive-to-store',JSON.stringify(accepted));
  await shot("accepted");
  await tap('#ryder-phone-close');
  const restored=await frame.evaluate(() => ({visible:window.__capyGame.phone.visible,state:window.h.manager.getState(),pe:getComputedStyle(document.querySelector('#okada-btn-throttle')).pointerEvents}));
  check("F: trusted Close dismisses app-open Phone and restores neutral controls",!restored.visible && restored.state.throttle===0 && restored.state.steer===0 && restored.pe==='auto',JSON.stringify(restored));
  const gas2=await center('#okada-btn-throttle'); const st2=await center('#okada-steer');
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{id:3,...st2},{id:4,...gas2}]});
  await touches([{id:3,x:st2.x+30,y:st2.y-10},{id:4,...gas2}]);
  // Capture proof atomically: speed fluctuates between frames. Retain only
  // copied normalized state and a numeric speed, never a physics wrapper.
  const motionProof = await frame.waitForFunction(() => {
    const s = window.h.manager.getState();
    const speed = window.__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed;
    return s.steer > 0 && s.throttle === 1 && Math.abs(speed) > .01 ? {s, speed} : false;
  }, null, {timeout:5000});
  const driving = await motionProof.jsonValue();
  await motionProof.dispose();
  check("F: accept-close-driving works with actual vehicle motion",driving.s.steer>0 && driving.s.throttle===1 && Math.abs(driving.speed)>.01,JSON.stringify(driving));
  await touches([]); await frame.evaluate(() => window.h.reset('QA release'));
  await shot("driving_restored");
  await frame.locator('#okada-btn-phone').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  check("F: Phone remains keyboard-accessible",await frame.evaluate(()=>window.__capyGame.phone.visible));
  await frame.locator('#ryder-phone-close').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  check("F: Close remains keyboard-accessible",await frame.evaluate(()=>!window.__capyGame.phone.visible));
  await stableFrames('post-order-driving');
  // Route one real pooled HTML SFX through a test analyser. Music analyser is
  // a silent parallel probe after the canonical gain; it adds no audible copy.
  await frame.evaluate(async () => {
    const a=window.__capyAudio; a.setMuted(false); a.playSfx('missionCompleteBg');
    const el=window.__lastPlayedMedia; window.__sfx=el; el.loop=true;
    const ctx=new AudioContext(); await ctx.resume();
    const source=ctx.createMediaElementSource(el), analyser=ctx.createAnalyser(); source.connect(analyser); analyser.connect(ctx.destination);
    a.startMusic('cityAmbience',.8);
    const m=a._music.cityAmbience; await m._ctx.resume();
    const probe=m._ctx.createAnalyser(), silent=m._ctx.createGain(); silent.gain.value=0;
    m._gain.connect(probe); probe.connect(silent); silent.connect(m._ctx.destination);
    window.__meters={sfx:analyser,music:probe}; window.__audioRef={source:m._source,plays:el.__plays};
  });
  const meter=async () => frame.evaluate(async () => {
    const rms={sfx:0,music:0};
    for(let i=0;i<12;i++){ for(const [key,a] of Object.entries(window.__meters)){const b=new Float32Array(a.fftSize);a.getFloatTimeDomainData(b);rms[key]=Math.max(rms[key],Math.sqrt(b.reduce((s,x)=>s+x*x,0)/b.length));} await new Promise(r=>setTimeout(r,50)); }
    const a=window.__capyAudio;return {rms,muted:a.isMuted(),sfxMuted:window.__sfx.muted,playing:!window.__sfx.paused,honk:a._honkMaster.gain.value,drift:a._driftAudio.muted,plays:window.__sfx.__plays,sameSource:a._music.cityAmbience._source===window.__audioRef.source,persisted:localStorage.getItem('capy.muted')};
  });
  await page.waitForTimeout(1000);
  const before=await meter(); check("G: real playing music and pooled SFX produce measurable output",before.rms.music>1e-7 && before.rms.sfx>1e-7 && before.playing,JSON.stringify(before));
  await tap('#btn-mute'); await page.waitForTimeout(200);
  const muted=await meter(); check("G: trusted mute silences actual music AND already-playing SFX output",muted.muted && muted.sfxMuted && muted.rms.music<1e-8 && muted.rms.sfx<1e-8,JSON.stringify(muted));
  check("G: honk/drift and persisted state agree with mute",muted.honk===0 && muted.drift && muted.persisted==='1',JSON.stringify(muted));
  await shot("muted");
  const newSfx=await frame.evaluate(() => {window.__capyAudio.playSfx('pop');const e=window.__lastPlayedMedia;return {muted:e.muted,volume:e.volume};});
  check("G: SFX started while muted is silent",newSfx.muted && newSfx.volume===0,JSON.stringify(newSfx));
  await tap('#btn-mute'); await page.waitForTimeout(200);
  const unmuted=await meter(); check("G: unmute restores both outputs without restarting active media",!unmuted.muted && !unmuted.sfxMuted && unmuted.rms.music>1e-7 && unmuted.rms.sfx>1e-7 && unmuted.sameSource && unmuted.plays===before.plays,JSON.stringify(unmuted));
  await tap('#btn-mute'); await tap('#okada-btn-phone');

  const resumed=await meter();check("G: mute survives another Phone transition",resumed.muted && resumed.rms.music<1e-8 && resumed.rms.sfx<1e-8 && await frame.evaluate(()=>window.__ryderAudio.installed),JSON.stringify(resumed));
  await tap('#ryder-phone-close'); await tap('#btn-mute');
  await frame.evaluate(()=>{window.__sfx.pause();window.__sfx.loop=false;});
  check("H: no runtime errors during verification",runtimeErrors.length===0,runtimeErrors.join(" | ").slice(0,2500));
  await cleanup();
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\nTOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed} | FAILED: ${failed}`);
  if (failed > 0) { console.error("FAILURES DETECTED IN PHASE 2D-R1"); process.exit(1); }
  console.log("ALL PHASE 2D-R1 CHECKS PASSED");
}
main().catch(async (e) => { console.error("Fatal verification error:", e); await cleanup(); process.exitCode=1; });
