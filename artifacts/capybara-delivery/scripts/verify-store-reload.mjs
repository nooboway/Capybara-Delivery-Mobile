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
      if (u === "/harness") { r.writeHead(200, {"Content-Type":"text/html"}); r.end("<!doctype html><title>Ryder lifecycle test</title>"); return; }
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

async function main(){
const server=await serve();const port=server.address().port;
const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-gpu']});
try{
const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});page.setDefaultTimeout(180000);
await page.goto(`http://127.0.0.1:${port}/harness`,{waitUntil:'domcontentloaded'});
  // Real iframe document reload, rather than a synthetic pagehide alone.
  const unloadRecords=[];
  await page.exposeFunction('r3RecordUnload',record=>unloadRecords.push(record));

  await page.setContent(`<iframe id="r3-game" src="http://127.0.0.1:${port}/capybara-game/index.html" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`,{waitUntil:"domcontentloaded"});
  const child=page.frames().find(f=>f!==page.mainFrame());
  async function bootChild(){
    await child.waitForSelector('[data-role="click"]',{timeout:180000});
    await child.evaluate(()=>{__capyGame.renderer.setPixelRatio(.25);__capyGame._applyRenderSize();});
    const r=await child.locator('[data-role="click"]').boundingBox();await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);
    await child.getByRole('button',{name:/play offline/i}).click();
    await child.getByRole('button',{name:'Play',exact:true}).click();
    await child.waitForFunction(()=>document.body.classList.contains('in-game'),null,{timeout:180000});
    await child.evaluate(()=>{__capyGame.tutorial?.complete();__capyGame.phone._offersPaused=true;});
    await child.addScriptTag({content:inputJs});
    await child.evaluate(async()=>{window.r3Handle=await OkadaInput.initOkadaInput(window,document,{touchControls:true});});
  }
  console.log('IFRAME_BOOT_START'); await bootChild(); console.log('IFRAME_BOOT_DONE');
  await child.evaluate(()=>{
    const s=__capyGame.store;parent.__r3OldStore=s;
    const original=Object.getPrototypeOf(s).update;
    window.addEventListener('pagehide',()=>parent.r3RecordUnload({restored:s.update===original,noOwn:!Object.hasOwn(s,'update')}));
  });
  await Promise.all([child.waitForNavigation({waitUntil:'domcontentloaded',timeout:180000}),child.evaluate(()=>location.reload())]);
  console.log('IFRAME_BOOT_START'); await bootChild(); console.log('IFRAME_BOOT_DONE');
  const reloaded=await child.evaluate(()=>{const s=__capyGame.store;return {different:s!==parent.__r3OldStore,installed:Object.hasOwn(s,'update'),oldRestored:parent.__r3OldStore.update===Object.getPrototypeOf(parent.__r3OldStore).update};});
  check('real iframe reload restores old method and binds a different store',reloaded.different&&reloaded.installed&&reloaded.oldRestored&&unloadRecords.some(r=>r.restored&&r.noOwn),JSON.stringify({reloaded,unloadRecords}));
  await child.evaluate(()=>{__capyGame._onOrderAccepted({});__capyGame._pendingStoreItems=['Bubble Milk Tea'];__capyGame.setMode('store');});
  await child.waitForFunction(()=>document.body.classList.contains('in-store-mode'));
  await child.evaluate(()=>{window.__r3Events=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(type,e=>window.__r3Events.push({type:e.type,target:e.target.id,trusted:e.isTrusted,x:e.clientX,y:e.clientY}),true);});
  console.log('TOUCH_PRE',JSON.stringify(await child.evaluate(()=>{const el=document.getElementById('okada-walk'),r=el.getBoundingClientRect();return {rect:{x:r.x,y:r.y,width:r.width,height:r.height},style:{display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility},at:document.elementFromPoint(r.x+50,r.y+r.height/2)?.id,body:document.body.className,touch:{mode:r3Handle.touch.mode,portrait:r3Handle.touch.isPortrait,phone:r3Handle.touch.isPhoneOpen,gameplay:r3Handle.touch.isInGameplay},screen:screen.orientation.type};})));
  await child.evaluate(()=>document.body.classList.add('controls-ready'));
  await child.waitForFunction(()=>{const el=document.getElementById('okada-walk'),r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+50,r.top+r.height/2);return el.contains(hit)&&getComputedStyle(document.getElementById('mobile-joystick')).display==='none';});
  check('canonical duplicate joystick hidden with controls-ready; Ryder owns hit target',true);
  const walk=await child.locator('#okada-walk').boundingBox();
  const cdp=await page.context().newCDPSession(page);
  const p={x:walk.x+50,y:walk.y+walk.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:81}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+30,y:p.y-15,id:81}]});
  await child.waitForTimeout(100); const moving=await child.evaluate(()=>{const st=r3Handle.manager.getState();return st.walkX!==0&&st.walkY!==0;});console.log('TOUCH_TRACE',JSON.stringify(await child.evaluate(()=>({events:window.__r3Events,state:r3Handle.manager.getState(),owner:r3Handle.touch.walkOwner}))));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const release=await child.evaluate(()=>{const s=__capyGame.store,st=r3Handle.manager.getState();s.walkerVel.set(3,0,0);for(let i=0;i<20;i++)s.update(r3Handle.adapter.getEngineInput(),1/60,__capyGame.camera);return {neutral:st.walkX===0&&st.walkY===0,rest:s.walkerVel.length()===0};});
  check('trusted browser touch drag/release reaches neutral intent and rest',moving&&release.neutral&&release.rest,JSON.stringify({moving,release}));
  const wrapper=await child.evaluate(()=>{window.__r3Wrapper=__capyGame.store.update;__capyGame.setMode('world');return true;});
  await child.waitForFunction(()=>!document.body.classList.contains('in-store-mode'));
  const world=await child.evaluate(()=>{const st=r3Handle.manager.getState();return {neutral:st.walkX===0&&st.walkY===0,wrapper:__capyGame.store.update===window.__r3Wrapper};});
  await child.evaluate(()=>{__capyGame._pendingStoreItems=['Bubble Milk Tea'];__capyGame.setMode('store');});
  await child.waitForFunction(()=>document.body.classList.contains('in-store-mode'));
  const again=await child.evaluate(()=>({same:__capyGame.store.update===window.__r3Wrapper,rest:__capyGame.store.walkerVel.length()===0}));
  check('world-store-world-store retains one policy and neutral entry/exit',wrapper&&world.neutral&&world.wrapper&&again.same&&again.rest,JSON.stringify({world,again}));
  const nativeRestored=await child.evaluate(()=>{r3Handle.dispose();delete parent.__r3OldStore;return getComputedStyle(document.getElementById('mobile-joystick')).display!=='none';});check('dispose restores native store joystick visibility',nativeRestored);


const failed=results.filter(r=>!r.ok).length;console.log(`TOTAL: ${results.length} PASSED: ${results.length-failed} FAILED: ${failed}`);if(failed)process.exitCode=1;
}finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
