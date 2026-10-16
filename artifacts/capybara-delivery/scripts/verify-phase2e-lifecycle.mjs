// Component/lifecycle verification against a minimal canonical input fixture.
// Actual physics and full delivery are tested separately in the production app.
import{createRequire}from'node:module';import path from'node:path';import fs from'node:fs';import{fileURLToPath}from'node:url';
const require=createRequire(import.meta.url),pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(pkg,'../..');
const out=path.join(repo,'node_modules/.cache/okada-verify/phase2e-lifecycle.js');fs.mkdirSync(path.dirname(out),{recursive:true});
require(path.join(repo,'node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild')).buildSync({entryPoints:[path.join(pkg,'src/lib/input/index.ts')],bundle:true,format:'iife',globalName:'OkadaInput',outfile:out});
const pw=require('C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core'),browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
let n=0;function check(name,ok,data){console.log(ok?'PASS':'FAIL',name,data?JSON.stringify(data):'');if(!ok)throw Error(name);n++;}
try{
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}iframe{width:100%;height:100%;border:0}</style><iframe srcdoc="<body class=in-game><div id=top-right-controls><button id=btn-menu>Menu</button><button id=btn-mute>Mute</button></div><div id=phone-hud style=display:none></div></body>"></iframe>');
 const frame=page.frames().find(f=>f!==page.mainFrame());await frame.addScriptTag({path:out});
 await frame.evaluate(()=>{
  window.makeInput=()=>{const r={};for(const k of ['steerDir','walkVec','forward','backward','brake','shift','interact','wheelie'])Object.defineProperty(r,k,{configurable:true,get:()=>k==='walkVec'?{x:0,z:0,active:false}:k==='steerDir'?0:false});return r;};
  window.native=makeInput();window.originalForward=Object.getOwnPropertyDescriptor(native,'forward').get;
  window.__capyGame={world:{_lastInput:native},phone:{visible:false,show(){this.visible=true;},minimize(){this.visible=false;}}};
  window.muteClicks=0;document.getElementById('btn-mute').addEventListener('click',()=>muteClicks++);
  window.menuTrace=[];addEventListener('click',e=>menuTrace.push({trusted:e.isTrusted,detail:e.detail,target:e.target.id||e.target.className}),true);
  document.getElementById('btn-menu').addEventListener('click',()=>{const overlay=document.createElement('div');overlay.className='capy-confirm-overlay visible';overlay.style.cssText='position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center';const cancel=document.createElement('button');cancel.className='capy-confirm-btn';cancel.textContent='No';cancel.style.cssText='width:120px;height:50px';cancel.addEventListener('click',()=>overlay.remove());overlay.append(cancel);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});document.body.append(overlay);});
  const shop=document.createElement('button');shop.className='capy-mbtn small';shop.textContent='Vibe Jam Portal';document.body.append(shop);window.portalClicks=0;shop.addEventListener('click',()=>portalClicks++);
 });
 await frame.evaluate(async()=>window.handle=await OkadaInput.initOkadaInput(window,document));
 await frame.waitForFunction(()=>handle.touch.getUIState()==='WORLD');
 const cdp=await page.context().newCDPSession(page),center=async sel=>{const b=await frame.locator(sel).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2};},send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 check('current engine-bound source renders WORLD',await frame.evaluate(()=>getComputedStyle(document.getElementById('okada-btn-throttle')).visibility==='visible'&&handle.adapter.getEngineInput()===__capyGame.world._lastInput));
 check('one active joystick surface, no native input ownership',await frame.evaluate(()=>getComputedStyle(document.getElementById('okada-walk')).display==='none'&&document.documentElement.dataset.ryderMobile==='owned'));
 const gas=await center('#okada-btn-throttle'),steer=await center('#okada-steer'),drift=await center('#okada-btn-drift');
 await send('touchStart',[{id:1,...steer},{id:2,...gas},{id:3,...drift}]);await send('touchMove',[{id:1,x:steer.x+30,y:steer.y-10},{id:2,...gas},{id:3,...drift}]);
 check('trusted three-pointer semantic input reaches engine',await frame.evaluate(()=>native.forward&&native.shift&&native.steerDir===.5),await frame.evaluate(()=>({state:handle.manager.getState(),ui:handle.touch.getUIState(),owner:handle.touch.steerOwner})));
 await send('touchEnd',[{id:3,...drift}]);
 check('partial DRIFT release preserves GAS and steering owners',await frame.evaluate(()=>!native.shift&&native.forward&&native.steerDir===.5));await send('touchEnd',[]);
 const brake=await center('#okada-btn-brake');await send('touchStart',[{id:30,...brake}]);
 check('unknown speed preserves deterministic braking first',await frame.evaluate(()=>native.brake&&!native.backward&&handle.manager.getState().brake===1));await send('touchEnd',[]);
 await send('touchStart',[{id:4,...gas}]);await page.waitForTimeout(1200);await send('touchEnd',[]);
 check('long GAS hold never latches after release',await frame.evaluate(()=>!native.forward&&!handle.touch.isGasLocked));
 await send('touchStart',[{id:5,...gas}]);await send('touchCancel',[]);
 check('trusted pointer cancellation releases action',await frame.evaluate(()=>!native.forward&&!handle.touch.capturedPointers.size));
 await send('touchStart',[{id:6,...steer},{id:7,...gas}]);await send('touchMove',[{id:6,x:steer.x+30,y:steer.y},{id:7,...gas}]);
 const oldPointer=await frame.evaluate(()=>handle.touch.steerOwner);await frame.evaluate(()=>dispatchEvent(new Event('blur')));
 await frame.evaluate(id=>document.getElementById('okada-steer').dispatchEvent(new PointerEvent('pointermove',{pointerId:id,clientX:400,clientY:200})),oldPointer);
 check('blur neutralizes and old pointer cannot resurrect',await frame.evaluate(()=>!native.forward&&!native.steerDir&&!handle.touch.capturedPointers.size));await send('touchEnd',[]);
 const phone=await center('#okada-btn-phone');await send('touchStart',[{id:8,...gas}]);await send('touchStart',[{id:8,...gas},{id:9,...phone}]);await send('touchEnd',[{id:9,...phone}]);
 check('Phone opening resets still-physically-held GAS',await frame.evaluate(()=>handle.touch.getUIState()==='PHONE'&&!native.forward&&!handle.touch.capturedPointers.size));
 const close=await center('#ryder-phone-close');await send('touchStart',[{id:8,...gas},{id:10,...close}]);await send('touchEnd',[{id:10,...close}]);await send('touchMove',[{id:8,x:gas.x+1,y:gas.y}]);
 check('Phone close cannot restore a stale held finger',await frame.evaluate(()=>handle.touch.getUIState()==='WORLD'&&!native.forward));await send('touchEnd',[]);
 await frame.locator('#btn-mute').tap();check('HUD pointer plus compatibility click activates mute once',await frame.evaluate(()=>muteClicks===1));
 await frame.locator('#btn-mute').focus();await page.keyboard.press('Enter');check('canonical HUD keyboard activation remains available',await frame.evaluate(()=>muteClicks===2));
 await frame.locator('#btn-menu').tap();await page.waitForTimeout(150);
 check('Menu survives retargeted compatibility click after pointer activation',await frame.evaluate(()=>!!document.querySelector('.capy-confirm-overlay')&&handle.touch.getUIState()==='MENU'),await frame.evaluate(()=>menuTrace));
 await frame.locator('.capy-confirm-btn').tap();await page.waitForTimeout(100);check('trusted Menu cancel restores neutral WORLD',await frame.evaluate(()=>handle.touch.getUIState()==='WORLD'&&!native.forward));
 await frame.getByRole('button',{name:'SHOP',exact:true}).tap();
 check('trusted Shop pointer opens owned UI without canonical Portal action',await frame.evaluate(()=>handle.touch.getUIState()==='SHOP'&&portalClicks===0));
 await frame.locator('#ryder-shop-close').tap();check('Shop close restores neutral live input state',await frame.evaluate(()=>handle.touch.getUIState()==='WORLD'&&!native.forward));
 await frame.evaluate(()=>__capyGame.world._lastInput=makeInput());await frame.waitForFunction(()=>handle.touch.getUIState()==='DISCONNECTED');
 check('replaced engine input hides all controls',await frame.evaluate(()=>[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).visibility==='hidden'&&getComputedStyle(e).pointerEvents==='none')));
 await frame.evaluate(async()=>{window.old=handle;window.handle=await OkadaInput.initOkadaInput(window,document);});
 check('new generation disposes old source before binding new input',await frame.evaluate(()=>!old.touch.attached&&old.touch.capturedPointers.size===0&&handle.adapter.getEngineInput()===__capyGame.world._lastInput&&handle.touch.getUIState()==='WORLD'));
 check('old adapter descriptors restored faithfully',await frame.evaluate(()=>Object.getOwnPropertyDescriptor(native,'forward').get===originalForward));
 await frame.evaluate(()=>{handle.dispose();handle.dispose();});
 check('idempotent whole-handle disposal removes source, listeners and DOM',await frame.evaluate(()=>!handle.touch.attached&&!handle.touch.capturedPointers.size&&!document.getElementById('okada-phase1-controls-root')&&!document.getElementById('okada-phase1-controls-style')&&!window.__okadaInput));
 check('native HUD and ownership restored after disposal',await frame.evaluate(()=>!document.documentElement.hasAttribute('data-ryder-mobile')&&document.getElementById('btn-menu').parentElement.id==='top-right-controls'&&document.getElementById('btn-mute').parentElement.id==='top-right-controls'));
 check('Shop disposal restores canonical metadata and label',await frame.evaluate(()=>{const b=document.querySelector('.capy-mbtn');return b.textContent==='Vibe Jam Portal'&&!b.hasAttribute('aria-label')&&!b.hasAttribute('data-touch-control');}));
 check('outer-document probe removed',await page.evaluate(()=>!document.getElementById('ryder-parent-safe-probe')));
 check('zero runtime errors',errors.length===0,errors);console.log(`TOTAL ${n}/${n} PASS`);
}finally{await browser.close();}
