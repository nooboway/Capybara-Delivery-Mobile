// Ryder Phase 2C-R3 — store-motion INTEGRATION regression (browser, deterministic).
//
// Replaces the earlier confounded probe that installed its OWN duplicate damping
// wrapper before sampling. This suite installs the REAL acceptance path only:
// initOkadaInput() -> installRyderStoreMotionPolicy(). It never adds a second
// wrapper and never modifies the canonical bundle.
//
// Proves, against the real canonical store.update consumer with a controlled
// fixed-dt step loop:
//   * canonical update executes exactly once per store.update call;
//   * damping applies ONLY when effective walking intent is neutral;
//   * active walking speed/direction remain responsive (no touch/keyboard coupling);
//   * practical rest from full speed is 100-200 ms; sustained wall rebound ends at 0;
//   * native keyboard fallback works while touch is registered but inactive;
//   * wrapper install is idempotent and dispose/pagehide restore + rebind correctly.
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

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".bin": "application/octet-stream",
};

function serve() {
  return new Promise((res, rej) => {
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
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => res(s));
  });
}

// Bundle ONLY the real input module (which pulls in the real policy).
const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "okada-input.js");
esbuild.buildSync({ entryPoints: [path.join(PKG, "src/lib/input/index.ts")], bundle: true, format: "iife", globalName: "OkadaInput", outfile: out, logLevel: "silent" });
const inputJs = fs.readFileSync(out, "utf8");

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
}

const DT = 1 / 60;

async function main() {
  console.log("=== RYDER PHASE 2C-R3 STORE-MOTION INTEGRATION ===");

  const raw = fs.readFileSync(BUNDLE);
  const actual = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
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
  await page.getByRole('button', { name: /play offline/i }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('in-game'), null, { timeout: 180000 });
  await page.evaluate(() => { window.__capyGame.tutorial?.complete(); if (window.__capyGame.phone) window.__capyGame.phone._offersPaused = true; });

  // ---- Install an observation spy on the canonical prototype update BEFORE init.
  // The policy captures store.update as its "original"; the spy counts every
  // canonical execution and records post-canonical velocity. No wrapper is added.
  await page.evaluate(() => {
    const proto = Object.getPrototypeOf(window.__capyGame.store);
    const real = proto.update;
    window.__spy = { count: 0, post: null };
    proto.update = function (input, dt, camera) {
      window.__spy.count++;
      const res = real.call(this, input, dt, camera);
      window.__spy.post = { x: this.walkerVel.x, z: this.walkerVel.z };
      return res;
    };
  });

  const frame = page.mainFrame();
  await frame.addScriptTag({ content: inputJs });
  await frame.evaluate(async () => { window.h = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true }); });

  // ---- GROUP A: real policy installed; canonical runs exactly once ----------
  const installCheck = await page.evaluate(() => {
    const s = window.__capyGame.store;
    const proto = Object.getPrototypeOf(s);
    const ownWrapper = Object.prototype.hasOwnProperty.call(s, "update") && s.update !== proto.update;
    const before = window.__spy.count;
    const input = window.h.adapter.getEngineInput();
    s.update(input, 1 / 60, window.__capyGame.camera);
    return { ownWrapper, delta: window.__spy.count - before, equalsProto: s.update === proto.update };
  });
  check("acceptance path installs the Ryder store policy (own wrapper)", installCheck.ownWrapper);
  check("canonical store.update executes exactly once per call", installCheck.delta === 1, `delta=${installCheck.delta}`);
  check("wrapper is not the canonical prototype method", !installCheck.equalsProto);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => { window.__capyGame.renderer.setPixelRatio(1.0); window.__capyGame._applyRenderSize(); });

  // Enter store through the canonical fixture.
  await page.evaluate(() => { window.__capyGame._onOrderAccepted({}); window.__capyGame._pendingStoreItems = ["Bubble Milk Tea"]; window.__capyGame.setMode("store"); });
  await page.waitForFunction(() => document.body.classList.contains("in-store-mode"), null, { timeout: 180000 });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const g = window.__capyGame, s = g.store, h = window.h;
    const canon = Object.getPrototypeOf(s).update;
    window.__st = {
      reset() { s.walkerVel.set(0, 0, 0); h.manager.reset(); },
      input() { return h.adapter.getEngineInput(); },
      apply(x, y) { h.manager.apply("touch", { walkX: x, walkY: y }); },
      release() { h.manager.release("touch"); },
      step(n) { const inp = h.adapter.getEngineInput(); for (let i = 0; i < n; i++) s.update(inp, 1 / 60, g.camera); },
      stepCanon(n) { const inp = h.adapter.getEngineInput(); for (let i = 0; i < n; i++) canon.call(s, inp, 1 / 60, g.camera); },
      vel() { return Math.hypot(s.walkerVel.x, s.walkerVel.z); },
      vx() { return s.walkerVel.x; },
      setVel(x, z) { s.walkerVel.set(x, 0, z); },
    };
  });

  check("store is active in store mode", await page.evaluate(() => window.__capyGame.store.isActive === true));

  // ---- GROUP B: native keyboard fallback while touch is registered ----------
  await page.evaluate(() => window.__st.release());
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(150);
  const kbd = await page.evaluate(() => {
    const rC = window.__capyGame.world._lastInput;
    const st = window.__st;
    st.reset();
    st.step(20); // keyboard-held: native intent must accelerate, NOT be damped
    return { walkVec: rC.walkVec, state: window.h.manager.getState(), vel: st.vel(), vz: window.__capyGame.store.walkerVel.z };
  });
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(100);
  check("keyboard fallback reaches engine while touch is registered", kbd.walkVec.z === -1, JSON.stringify(kbd.walkVec));
  check("normalized touch state stays neutral under keyboard", kbd.state.walkX === 0 && kbd.state.walkY === 0);
  check("keyboard walking accelerates (no touch-coupled damping)", kbd.vel > 0.2 && kbd.vz < 0, `vel=${kbd.vel.toFixed(3)} vz=${kbd.vz.toFixed(3)}`);

  // ---- GROUP C: practical stop from full walking speed ----------------------
  const maxStop = await page.evaluate(() => {
    const st = window.__st;
    st.reset();
    st.apply(1, 0);
    st.step(30);
    const v0 = st.vel();
    st.release();
    let frames = -1;
    for (let f = 1; f <= 150; f++) { st.step(1); if (st.vel() < 1e-12) { frames = f; break; } }
    return { v0, frames, stopMs: frames * 1000 / 60, finalVel: st.vel() };
  });
  check("store reaches full walking speed while held", maxStop.v0 > 1.0, `v0=${maxStop.v0.toFixed(3)}`);
  check("practical rest from full speed within 100-200 ms", maxStop.frames > 0 && maxStop.stopMs >= 100 && maxStop.stopMs <= 200, `stopMs=${maxStop.stopMs.toFixed(1)}`);
  check("velocity is exactly zero at rest (no linger)", maxStop.finalVel === 0);

  // ---- GROUP D: diagonal release -------------------------------------------
  const diag = await page.evaluate(() => {
    const st = window.__st;
    st.reset();
    st.apply(1, 1);
    st.step(30);
    const v0 = st.vel();
    st.release();
    let frames = -1;
    for (let f = 1; f <= 150; f++) { st.step(1); if (st.vel() < 1e-12) { frames = f; break; } }
    return { v0, frames, stopMs: frames * 1000 / 60 };
  });
  check("diagonal walking preserves speed while held", diag.v0 > 1.0, `v0=${diag.v0.toFixed(3)}`);
  check("diagonal release rests within 100-200 ms", diag.frames > 0 && diag.stopMs >= 100 && diag.stopMs <= 200, `stopMs=${diag.stopMs.toFixed(1)}`);

  // ---- GROUP E: low-speed release ------------------------------------------
  const low = await page.evaluate(() => {
    const st = window.__st;
    st.reset();
    st.release();
    st.setVel(0.3, 0);
    let frames = -1;
    for (let f = 1; f <= 60; f++) { st.step(1); if (st.vel() < 1e-12) { frames = f; break; } }
    return { frames, stopMs: frames * 1000 / 60 };
  });
  check("low-speed release comes to rest <= 200 ms", low.frames > 0 && low.stopMs <= 200, `stopMs=${low.stopMs.toFixed(1)}`);

  // ---- GROUP F: sustained wall rebound eliminated (differential) ------------
  const rebound = await page.evaluate(() => {
    const st = window.__st;
    const seq = (policy) => {
      st.reset();
      st.apply(1, 0);
      st.step(8);
      st.release();
      const samples = [];
      for (let f = 0; f < 90; f++) { policy ? st.step(1) : st.stepCanon(1); samples.push(st.vel()); }
      return { final: st.vel(), samples };
    };
    const withPolicy = seq(true);
    const canonOnly = seq(false);
    // resurrection check: after first exact 0, must never become nonzero again
    const firstZero = withPolicy.samples.findIndex((v) => v < 1e-12);
    const noResurrection = firstZero === -1 || withPolicy.samples.slice(firstZero).every((v) => v < 1e-12);
    return { policyFinal: withPolicy.final, canonFinal: canonOnly.final, noResurrection };
  });
  check("policy: no sustained rebound after wall collision (final velocity exactly 0)", rebound.policyFinal === 0, `final=${rebound.policyFinal}`);
  check("policy: no rebound resurrection after rest", rebound.noResurrection);
  check("control: canonical-only retains rebound motion", rebound.canonFinal > 0.1, `canonFinal=${rebound.canonFinal.toFixed(3)}`);

  // ---- GROUP G: active responsiveness, no physics coupling while moving -----
  const active = await page.evaluate(() => {
    const st = window.__st;
    st.reset();
    st.apply(1, 0);
    st.step(1);
    const coupled = { store: { x: window.__capyGame.store.walkerVel.x, z: window.__capyGame.store.walkerVel.z }, post: window.__spy.post };
    st.step(20);
    const forward = st.vx();
    st.apply(-1, 0);
    st.step(30);
    const reversed = st.vx();
    return { coupled, forward, reversed };
  });
  check("no damping when intent active (store velocity == canonical post-step)", active.coupled.store.x === active.coupled.post.x && active.coupled.store.z === active.coupled.post.z, JSON.stringify(active.coupled));
  check("forward walking is responsive (vx > 0)", active.forward > 0, `vx=${active.forward.toFixed(3)}`);
  check("direction change is responsive (vx < 0 after reversal)", active.reversed < 0, `vx=${active.reversed.toFixed(3)}`);

  // R3 completion gates. Controlled native steps; no product pause mechanism.
  const measured = await page.evaluate(() => {
    const g=__capyGame,s=g.store,h=window.h, native=Object.getPrototypeOf(s).update;
    const saved={colliders:s.colliders,bounds:s.bounds,pos:s.walkerPos.clone(),timer:s.timerActive};
    g.renderer.setAnimationLoop(null); h.reset(); s.timerActive=false;
    s.colliders=[]; s.bounds={minX:-100,maxX:100,minZ:-100,maxZ:100};
    const input={walkVec:{x:0,z:0,active:false},interact:false};
    const run=(rate,fps,x,z,policy=false)=>{
      s.walkerPos.set(0,0,0);s.walkerVel.set(x,0,z);s.bounceTimer=0;
      const points={},v0=Math.hypot(x,z);let stop=null,distance=0;
      for(let f=1;f<=fps;f++){
        const before=s.walkerPos.clone();
        if(policy)s.update(input,1/fps,g.camera);
        else {native.call(s,input,1/fps,g.camera);if(rate){s.walkerVel.x*=Math.exp(-rate/fps);s.walkerVel.z*=Math.exp(-rate/fps);if(Math.hypot(s.walkerVel.x,s.walkerVel.z)<=.05)s.walkerVel.set(0,0,0);}}
        distance+=before.distanceTo(s.walkerPos);
        const t=f/fps,v=Math.hypot(s.walkerVel.x,s.walkerVel.z);
        for(const ms of [50,100,150,200])if(points[ms]===undefined&&t>=ms/1000-1e-8)points[ms]=v;
        if(stop===null&&v===0)stop=t*1000;
      }
      return {rate,fps,v0,points,stopMs:stop,distance,final:Math.hypot(s.walkerVel.x,s.walkerVel.z)};
    };
    const candidates=[20,28,36].flatMap(k=>[[3,0],[.3,0],[3/Math.SQRT2,3/Math.SQRT2]].map(([x,z])=>run(k,120,x,z)));
    const rates=[30,60,90,120].map(fps=>run(28,fps,3,0,true));
    const baseline=run(0,60,3,0);
    const diag=run(28,60,3/Math.SQRT2,3/Math.SQRT2,true),low=run(28,60,.3,0,true);
    const active=[];
    for(const vec of [{x:1,z:0},{x:.42,z:.71}]){
      input.walkVec=vec;
      const seq=usePolicy=>{s.walkerPos.set(0,0,0);s.walkerVel.set(0,0,0);s.bounceTimer=0;for(let i=0;i<12;i++)(usePolicy?s.update:native).call(s,input,1/60,g.camera);return {x:s.walkerVel.x,z:s.walkerVel.z};};
      active.push({vector:vec,native:seq(false),policy:seq(true)});
    }
    input.walkVec={x:0,z:0};
    const idle=run(28,60,0,0,true);
    s.bounds=saved.bounds;
    const wall=usePolicy=>{s.walkerPos.set(s.bounds.maxX-.401,0,(s.bounds.minZ+s.bounds.maxZ)/2);s.walkerVel.set(3,0,0);s.bounceTimer=0;const samples=[];for(let f=0;f<90;f++){(usePolicy?s.update:native).call(s,input,1/60,g.camera);samples.push(Math.hypot(s.walkerVel.x,s.walkerVel.z));}return {samples,final:samples.at(-1),collision:samples[0]<3};};
    const walls={native:wall(false),policy:wall(true)};
    s.colliders=saved.colliders;s.walkerPos.copy(saved.pos);s.walkerVel.set(0,0,0);s.bounceTimer=0;s.timerActive=saved.timer;
    g.renderer.setAnimationLoop(()=>g._animate());
    return {candidates,rates,baseline,diag,low,idle,walls,active};
  });
  console.log('R3_MEASUREMENTS',JSON.stringify(measured));
  check('canonical baseline keeps released speed 3',measured.baseline.final===3);
  check('three candidate constants measured at full/low/diagonal speeds',measured.candidates.length===9);
  for(const r of measured.rates)check(`policy practical rest at ${r.fps} FPS`,r.stopMs>=100&&r.stopMs<=200&&r.final===0,JSON.stringify(r));
  check('diagonal rest inside envelope',measured.diag.stopMs>=100&&measured.diag.stopMs<=200);
  check('low-speed practical rest <=100ms',measured.low.stopMs<=100);
  check('store idle has no displacement',measured.idle.distance===0&&measured.idle.final===0);
  check('active native speed and continuous vectors preserved',measured.active.every(a=>Math.abs(a.native.x-a.policy.x)<1e-9&&Math.abs(a.native.z-a.policy.z)<1e-9));
  check('real native boundary collision occurred',measured.walls.policy.collision&&measured.walls.native.collision);
  check('wall policy settles without resurrection',measured.walls.policy.final===0&&measured.walls.policy.samples.slice(15).every(v=>v===0));
  check('canonical wall control continues moving',measured.walls.native.final>0);

  // Actual browser keyboard events with the real input system installed.
  for(const [key,axis,sign] of [['KeyW','z',-1],['KeyA','x',-1],['KeyS','z',1],['KeyD','x',1]]){
    await page.keyboard.down(key);
    const result=await page.evaluate(({axis,sign})=>{
      const h=window.h,s=__capyGame.store,input=h.adapter.getEngineInput();h.manager.reset();
      const idle=input.walkVec[axis]===sign;
      h.manager.apply('touch',{walkX:.42,walkY:-.71});const touch=input.walkVec;
      h.manager.release('touch');const resumed=input.walkVec[axis]===sign;
      const saved={colliders:s.colliders,bounds:s.bounds,pos:s.walkerPos.clone()};
      s.colliders=[];s.bounds={minX:-100,maxX:100,minZ:-100,maxZ:100};s.walkerPos.set(0,0,0);
      s.walkerVel.set(0,0,0);s.bounceTimer=0;s.update(input,1/60,__capyGame.camera);
      const moving=s.walkerVel[axis]*sign>0;
      s.colliders=saved.colliders;s.bounds=saved.bounds;s.walkerPos.copy(saved.pos);s.walkerVel.set(0,0,0);
      return {idle,resumed,touch,moving};
    },{axis,sign});
    await page.keyboard.up(key);
    check(`native ${key} idle-touch and released-touch fallback`,result.idle&&result.resumed&&result.moving,JSON.stringify(result));
  }
  await page.evaluate(()=>{const s=__capyGame.store;s.walkerPos.set(s.cartPickupPos.x,0,s.cartPickupPos.z);s.walkerVel.set(0,0,0);s._interactCooldown=0;});
  await page.keyboard.down('KeyE');
  const picked=await page.evaluate(()=>{const s=__capyGame.store;s.update(window.h.adapter.getEngineInput(),1/60,__capyGame.camera);return s.hasCart;});
  await page.keyboard.up('KeyE');check('native E acquires canonical cart',picked);

  for(const kind of ['pointerup','pointercancel','lostpointercapture','blur','visibility','orientation']){
    await page.evaluate(()=>{const h=window.h,el=document.getElementById('okada-walk');h.reset();const r=el.getBoundingClientRect();window.__r3Pointer={x:r.left+50,y:r.top+r.height/2};const {x,y}=window.__r3Pointer;for(const [type,dx] of [['pointerdown',0],['pointermove',30]])el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:712,clientX:x+dx,clientY:y-15}));});
    const wasActive=await page.evaluate(()=>window.h.manager.getState().walkX!==0);
    if(kind==='orientation'){await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));await page.waitForTimeout(100);}
    else await page.evaluate(kind=>{const el=document.getElementById('okada-walk');if(kind==='blur')window.dispatchEvent(new Event('blur'));else if(kind==='visibility'){Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;}else el.dispatchEvent(new PointerEvent(kind,{bubbles:true,pointerType:'touch',pointerId:712}));},kind);
    const after=await page.evaluate(()=>{const h=window.h,s=__capyGame.store;const before=h.manager.getState();document.getElementById('okada-walk').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:712,clientX:200,clientY:250}));s.walkerVel.set(3,0,0);for(let f=0;f<20;f++)s.update(h.adapter.getEngineInput(),1/60,__capyGame.camera);const st=h.manager.getState();return {neutral:before.walkX===0&&before.walkY===0,stale:st.walkX===0&&st.walkY===0,rest:s.walkerVel.length()===0};});
    check(`${kind} neutral intent, no resurrection, residual rest`,wasActive&&after.neutral&&after.stale&&after.rest,JSON.stringify({wasActive,...after}));
    if(kind==='orientation'){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);}
  }

  // ---- GROUP H: idempotent re-install + dispose/pagehide restore/rebind -----
  const rebind = await page.evaluate(async () => {
    const s = window.__capyGame.store;
    const proto = Object.getPrototypeOf(s);
    const first = s.update;
    window.h2 = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true });
    const afterReinit = { own: Object.prototype.hasOwnProperty.call(s, "update"), wrapper: s.update !== proto.update, changed: s.update !== first };
    const before = window.__spy.count;
    s.update(window.h2.adapter.getEngineInput(), 1 / 60, window.__capyGame.camera);
    const delta = window.__spy.count - before;
    return { afterReinit, delta };
  });
  check("re-init installs a fresh wrapper (no stacked wrappers)", rebind.afterReinit.own && rebind.afterReinit.wrapper && rebind.afterReinit.changed, JSON.stringify(rebind.afterReinit));
  check("re-init still executes canonical exactly once", rebind.delta === 1, `delta=${rebind.delta}`);

  const disposeCheck = await page.evaluate(() => {
    const s = window.__capyGame.store;
    const proto = Object.getPrototypeOf(s);
    window.h2.dispose();
    window.h2.manager.apply("touch", { walkX: 1, walkY: 0 });
    const rC = window.__capyGame.world._lastInput;
    const restored = !Object.prototype.hasOwnProperty.call(s, "update") && s.update === proto.update;
    const adapterRestored = rC.walkVec.x === 0 && rC.walkVec.z === 0; // override removed -> native neutral
    return { restored, adapterRestored };
  });
  check("dispose restores the canonical store.update descriptor", disposeCheck.restored);
  check("dispose restores the adapter (native getters rebound)", disposeCheck.adapterRestored);

  const pagehide = await page.evaluate(async () => {
    const s = window.__capyGame.store;
    const proto = Object.getPrototypeOf(s);
    window.h3 = await window.OkadaInput.initOkadaInput(window, document, { touchControls: true });
    const installed = s.update !== proto.update;
    window.dispatchEvent(new Event("pagehide"));
    const restored = !Object.prototype.hasOwnProperty.call(s, "update") && s.update === proto.update;
    return { installed, restored };
  });
  check("pagehide installs then restores the wrapper via lifecycle", pagehide.installed && pagehide.restored);

  await browser.close();
  server.close();

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\nTOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed} | FAILED: ${failed}`);
  if (failed > 0) { console.error("FAILURES DETECTED IN PHASE 2C-R3 INTEGRATION VERIFICATION"); process.exit(1); }
  console.log("ALL PHASE 2C-R3 INTEGRATION CHECKS PASSED");
}

main().catch((err) => { console.error("Fatal verification error:", err); process.exit(1); });
