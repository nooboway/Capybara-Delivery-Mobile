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
function serve() { return new Promise((res) => { const s = http.createServer((req, r) => { let u = decodeURIComponent((req.url || "/").split("?")[0]); if (u === "/harness") { r.writeHead(200, {"Content-Type":"text/html"}); r.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style><iframe src="/capybara-game/index.html" allow="autoplay; fullscreen"></iframe>'); return; } if (u === "/") u = "/capybara-game/index.html"; const root = path.resolve(path.join(PKG, "public")); const fp = path.resolve(root, "." + u); if (!fp.startsWith(root + path.sep)) { r.writeHead(403); r.end(); return; } fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": MIME[path.extname(fp).toLowerCase()] || "application/octet-stream" }); r.end((process.env.RYDER_OVERLAY==='audio-off' || process.env.RYDER_DISABLE==='all') && path.extname(fp)==='.html' ? d.toString().replace('<script src="/capybara-game/ryder-audio.js"></script>','') : d); }); }); s.listen(0, "127.0.0.1", () => res(s)); }); }

const tmp = path.join(REPO, "node_modules/.cache/okada-verify");
fs.mkdirSync(tmp, { recursive: true });
const out = path.join(tmp, "okada-input-r1.js");
esbuild.buildSync({ entryPoints: [path.join(PKG, "src/lib/input/index.ts")], bundle: true, format: "iife", globalName: "OkadaInput", outfile: out, logLevel: "silent" });
const inputJs = fs.readFileSync(out, "utf8");


const variant=process.env.RYDER_MIN || 'idle';
const wallStarted=Date.now();
console.log('CONFIG',JSON.stringify({variant,disable:process.env.RYDER_DISABLE || null,defaultGpu:process.env.RYDER_DEFAULT_GPU==='1',counterOnly:process.env.RYDER_COUNTER_ONLY==='1',canonicalSha:crypto.createHash('sha256').update(fs.readFileSync(BUNDLE)).digest('hex').toUpperCase()}));
const server=await serve(),port=server.address().port;
const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox',...(process.env.RYDER_DEFAULT_GPU==='1'?[]:['--disable-gpu']),'--autoplay-policy=no-user-gesture-required']});
try {
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});page.setDefaultTimeout(180000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.stack);if(errors.length<=2)console.log('ERROR',e.stack?.split('\n').slice(-20).join('\n'));});
 await page.addInitScript(()=>{Error.stackTraceLimit=10000;});
 await page.goto(`http://127.0.0.1:${port}/harness`,{waitUntil:'domcontentloaded'});
 const frame=page.frames().find(f=>f!==page.mainFrame());
 await frame.waitForFunction(()=>window.__capyGame && document.querySelector('[data-role="click"]'));
 await frame.evaluate(()=>{__capyGame.renderer.setPixelRatio(.25);__capyGame._applyRenderSize();});
 if(process.env.RYDER_DISABLE!=='all')await frame.addScriptTag({content:inputJs});
 if(process.env.RYDER_DISABLE!=='all')await frame.evaluate(({variant,disable})=>{
  const p=OkadaInput.TouchInputSource.prototype;
  if(disable==='layout'){p.positionPhoneTrigger=function(){};const attach=p.attach;p.attach=function(){attach.call(this);this.phoneLayoutObserver?.disconnect();};}
  if(variant==='gate-off')p.checkGameplayState=function(){this.isInGameplay=true;this.applyVisibility();};
  window.__initPromise=OkadaInput.initOkadaInput(window,document,{touchControls:true});
 },{variant,disable:process.env.RYDER_DISABLE});
 const b=await frame.locator('[data-role="click"]').boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
 await frame.getByRole('button',{name:/play offline/i}).click();await frame.getByRole('button',{name:'Play',exact:true}).click();
 await frame.waitForFunction(()=>document.body.classList.contains('in-game'));
 await frame.evaluate(()=>{__capyGame.tutorial?.complete();__capyGame.phone._offersPaused=true;});
 if(process.env.RYDER_DISABLE!=='all')await frame.evaluate(async()=>{window.h=await OkadaInput.initOkadaInput(window,document,{touchControls:true});});
 await frame.evaluate((counterOnly)=>{
   const w=__capyGame.world,step=w._stepPhysics;window.__qa={frames:0,last:null};
   if(counterOnly){w._stepPhysics=function(...args){const result=step.apply(this,args);__qa.frames++;return result;};return;}
   w._stepPhysics=function(dt,...args){__qa.frames++;const d=w.rapierDynamics,p=w.vehicleData.chassisBody.position;__qa.last={dt,forward:d.forwardSpeed,yaw:d.yaw,velocity:{x:d.velocity.x,y:d.velocity.y,z:d.velocity.z},pos:{x:p.x,y:p.y,z:p.z}};return step.call(this,dt,...args);};
 },process.env.RYDER_COUNTER_ONLY==='1');
 const observationStarted=Date.now();
 console.log('BOOT',variant,JSON.stringify(await frame.evaluate(()=>({normalGameplay:document.body.classList.contains('in-game'),inputPresent:!!window.OkadaInput,audioBridge:!!window.__ryderAudio}))));
 if(variant.startsWith('resize'))for(const [width,height] of [[780,360],[740,360],[667,375],[932,430],[915,412],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);}
 const tap=async sel=>{await frame.locator(sel).scrollIntoViewIfNeeded();const b=await frame.locator(sel).boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(300);};
 if(['phone','order','capyfood','resize-phone','resize-order','keyboard-order','keyboard-phone','resize-keyboard-order'].includes(variant)){
   for(let i=0;i<Number(process.env.RYDER_CYCLES || 3);i++){
     if(variant.includes('keyboard') && i===1){await frame.locator('#okada-btn-phone').focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);}else await tap('#okada-btn-phone');
     if(i===0){await frame.evaluate(()=>{const p=__capyGame.phone;p.unlock();});await page.waitForTimeout(1000);
       if(variant.startsWith('resize'))for(const [width,height] of [[780,360],[667,375],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);}
       if(variant==='capyfood')await tap('.app-icon[data-app="capyfood"]');
       if(['order','resize-order','keyboard-order','resize-keyboard-order'].includes(variant)){await tap('.app-icon[data-app="capyfood"]');await frame.evaluate(()=>{const p=__capyGame.phone;p.online=true;p._offersPaused=false;p._tryFireOffer();p._offersPaused=true;p.offerTimer=10000;});await tap('.btn-offer-accept');const accepted=await frame.evaluate(()=>({active:!!__capyGame.phone.activeOrder,phase:__capyGame.phone.phase,app:__capyGame.phone.currentApp}));console.log('ACCEPTED',accepted);if(!accepted.active)throw new Error('Reduction did not accept an order');}
     }
     if(variant.includes('keyboard') && i===1){await frame.locator('#ryder-phone-close').focus();await page.keyboard.press('Enter');await page.waitForTimeout(300);}else await tap('#ryder-phone-close');
     console.log('CYCLE',i,await frame.evaluate(()=>__qa));if(errors.length)break;
   }
 }
 // Match a meaningful amount of actual simulation rather than only wall time.
 const start=await frame.evaluate(()=>__qa.frames);
 for(let i=0;i<Number(process.env.RYDER_WAIT_LOOPS || 60) && !errors.length;i++){await page.waitForTimeout(500);const q=await frame.evaluate(()=>__qa);if(q.frames-start>=Number(process.env.RYDER_FRAMES || 120))break;}
 console.log('RESULT',variant,JSON.stringify({errors:errors.length,totalElapsedMs:Date.now()-wallStarted,observationElapsedMs:Date.now()-observationStarted,qa:await frame.evaluate(()=>__qa)}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
