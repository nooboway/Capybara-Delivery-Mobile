import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
import {runtimeChecks} from './phase2e-runtime-checks.mjs';
import {format} from 'node:util';
const evidence=process.env.RYDER_EVIDENCE_PATH||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../docs/ux/evidence/phase2e-native-controls.log');
fs.mkdirSync(path.dirname(evidence),{recursive:true});fs.writeFileSync(evidence,'');
for(const method of ['log','error']){const original=console[method].bind(console);console[method]=(...args)=>{fs.appendFileSync(evidence,format(...args)+'\n');original(...args);};}
const require=createRequire(import.meta.url);const pw=require('C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist/public');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.bin':'application/octet-stream'};
const server=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const p=path.resolve(root,'.'+u);if(!p.startsWith(root+path.sep)){r.writeHead(403).end();return;}fs.readFile(p,(e,d)=>{if(e){r.writeHead(404).end();return;}r.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}).end(d);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const results=[];function check(name,ok,data){results.push({name,ok});console.log(ok?'PASS':'FAIL',name,data?JSON.stringify(data):'');if(!ok)throw new Error(name);}
// Actual built React shell, first-time tutorial and returning-player sessions.
// No manual input initialization, tutorial.complete(), lock removal or physics writes.
const errors=[];
console.log('SUITE PROFILE',process.env.RYDER_PROFILE||'complete',process.env.RYDER_ROUTE_ONLY==='1'?'route-only':'full');
const shots=process.env.RYDER_SCREENSHOT_DIR||path.resolve(root,'../../../../docs/ux/screenshots/phase2e');fs.mkdirSync(shots,{recursive:true});
try {
 for (const fresh of process.env.RYDER_PROFILE==='returning'?[false]:[true,false]) {
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  if(!fresh)await context.addInitScript(()=>localStorage.setItem('capy.tutorial.completed','2'));
  const page=await context.newPage();page.setDefaultTimeout(240000);
  page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.locator('iframe').waitFor({state:'attached'});const frame=page.frames().find(f=>f!==page.mainFrame());
  await frame.waitForFunction(()=>window.__capyGame&&document.querySelector('[data-role="click"]'));
  await frame.locator('#okada-phase1-controls-root').waitFor({state:'attached'});
  await page.screenshot({path:path.join(shots,'menu-no-controls.png')});
  const tap=async sel=>{const el=typeof sel==='string'?frame.locator(sel):sel;if(sel==='[data-role="click"]'){const b=await el.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}else await el.tap();await page.waitForTimeout(200);};
  console.log('BOOT tap');await tap('[data-role="click"]');
  await frame.getByRole('button',{name:/play offline/i}).waitFor({state:'visible'});
  {
   const shop=frame.getByRole('button',{name:'SHOP',exact:true});
   await shop.waitFor({state:'visible'});
   check('Ryder Shop entry remains available on the menu',await shop.count()===1);await shop.tap();
   await frame.waitForFunction(()=>document.querySelector('#okada-phase1-controls-root').dataset.state==='SHOP');
   check('SHOP owns interaction with no gameplay targets',await frame.evaluate(()=>[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).pointerEvents==='none')));
   await frame.locator('#ryder-shop-close').tap();await page.screenshot({path:path.join(shots,'menu-no-controls.png')});
  }
  console.log('BOOT offline');await frame.getByRole('button',{name:/play offline/i}).click();
  await Promise.race([frame.waitForFunction(()=>document.body.classList.contains('in-game')),frame.getByRole('button',{name:'Play',exact:true}).waitFor({state:'visible'})]);
  if(!await frame.evaluate(()=>document.body.classList.contains('in-game')))await frame.getByRole('button',{name:'Play',exact:true}).click();
  await frame.waitForFunction(()=>document.body.classList.contains('in-game')&&!!window.__okadaInput?.adapter.isResolved());
  await frame.waitForFunction(()=>document.querySelector('#okada-phase1-controls-root')?.dataset.state==='WORLD');
  console.log('START',fresh?'first-time':'returning');
  await frame.evaluate(()=>{
   window.__qaHandle=__okadaInput;window.__qaEvents=[];
   for(const type of ['pointerdown','gotpointercapture','pointerup','pointercancel','lostpointercapture'])for(const button of document.querySelectorAll('#okada-btn-throttle,#okada-btn-brake'))button.addEventListener(type,e=>{
    const b=e.target.closest?.('#okada-btn-throttle,#okada-btn-brake');if(!b)return;
    queueMicrotask(()=>__qaEvents.push({type,trusted:e.isTrusted,target:e.target.tagName,button:b.id,pointer:e.pointerId,captured:b.hasPointerCapture(e.pointerId),source:{...__okadaInput.touch.contribution},manager:{...__okadaInput.state()},canonical:{forward:__capyGame.world._lastInput.forward,brake:__capyGame.world._lastInput.brake,reverse:__capyGame.world._lastInput.backward}}));
   });
  });
  const cdp=await context.newCDPSession(page);
  const press=async sel=>{const b=await frame.locator(sel).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:b.x+b.width/2,y:b.y+b.height/2}]});};
  const release=()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const snap=sel=>frame.evaluate(sel=>{const h=__okadaInput,w=__capyGame.world,b=document.querySelector(sel),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{hit:hit?.outerHTML,button:hit?.closest('button')?.id,visible:getComputedStyle(b).visibility,pointerEvents:getComputedStyle(b).pointerEvents,source:{...h.touch.contribution},manager:{...h.state()},adapterState:{...h.adapter.manager.getState()},canonical:{forward:w._lastInput.forward,brake:w._lastInput.brake,reverse:w._lastInput.backward},speed:w._bikeTelemetry.getDynamics().forwardSpeed,position:{x:w.playerGroup.position.x,z:w.playerGroup.position.z},current:h===__qaHandle,bound:h.adapter.getEngineInput()===w._lastInput,live:h.touch.attached,owners:[...h.touch.buttonOwners.get(sel.slice(1))],tutorial:__capyGame.tutorial?.state,locked:document.body.classList.contains('tutorial-locked')};},sel);
  const drive=async label=>{
   await press('#okada-btn-throttle');await page.waitForTimeout(700);const gas=await snap('#okada-btn-throttle');
   check(label+' GAS propagates and accelerates actual bike',gas.button==='okada-btn-throttle'&&gas.source.throttle===1&&gas.manager.throttle===1&&gas.adapterState.throttle===1&&gas.canonical.forward&&gas.speed>.5&&gas.current&&gas.bound&&gas.live,gas);
   await release();if(await frame.evaluate(()=>__okadaInput.touch.isGasLocked))await tap('#okada-btn-throttle');
   await press('#okada-btn-brake');const br=await snap('#okada-btn-brake');
   // The production controller can correctly switch to REV before a remote
   // snapshot returns. Use the acquisition microtask for the initial BRAKE
   // assertion, and telemetry below for the subsequent physical deceleration.
   const brakeDown=await frame.evaluate(()=>__qaEvents.findLast(e=>e.type==='pointerdown'&&e.button==='okada-btn-brake'));
   check(label+' moving BRAKE reaches canonical input',br.button==='okada-btn-brake'&&brakeDown?.source.brake===1&&brakeDown.source.reverse===0&&brakeDown.canonical.brake,{brakeDown,later:br});
   await frame.waitForFunction(()=>__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed<.15,null,{timeout:15000});
   const stopped=await snap('#okada-btn-brake');check(label+' BRAKE reduces actual forward speed',stopped.speed<gas.speed,stopped);
   await frame.waitForFunction(()=>__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed<-.5,null,{timeout:15000});
   const rev=await snap('#okada-btn-brake');const displacement=Math.hypot(rev.position.x-stopped.position.x,rev.position.z-stopped.position.z);
   check(label+' held REV produces actual reverse motion',rev.source.reverse===1&&rev.source.brake===0&&rev.canonical.reverse&&rev.speed<-.5&&displacement>.01,{...rev,displacement});
   await release();await page.waitForTimeout(200);
   const stick=await frame.locator('#okada-steer').boundingBox(),button=await frame.locator('#okada-btn-throttle').boundingBox();
   const gasPoint={id:1,x:button.x+button.width/2,y:button.y+button.height/2},origin={id:2,x:stick.x+stick.width/2,y:stick.y+stick.height/2};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...origin,x:origin.x+30}]});await page.waitForTimeout(350);
   const steering=await frame.evaluate(()=>({intent:__okadaInput.state().steer,canonical:__capyGame.world._lastInput.steerDir,yaw:__capyGame.world._bikeTelemetry.getDynamics().yaw,gas:__okadaInput.state().throttle}));
   check(label+' fractional steering parity reaches canonical input',Math.abs(steering.intent-.5)<.001&&Math.abs(steering.canonical-.5)<.001&&steering.gas===0,steering);
   await release();
   check(label+' release neutralizes owned controls',await frame.evaluate(()=>!__okadaInput.state().throttle&&!__okadaInput.state().brake&&!__okadaInput.state().reverse));
  };
  if(fresh){
   await frame.evaluate(()=>__capyGame.tutorial._skipEl?.setAttribute('data-qa-skip','true'));
   await press('[data-qa-skip]');await frame.waitForFunction(()=>__capyGame.tutorial.state!=='intro_cinematic');await release();
   await frame.waitForFunction(()=>__capyGame.tutorial.state==='await_tab'&&!__capyGame.phone._tabDisabled);
  }else{
   if(process.env.RYDER_ROUTE_ONLY!=='1'){
    await frame.evaluate(()=>{window.__idleSteps=0;const w=__capyGame.world,original=w._stepPhysics;w._stepPhysics=function(...args){const result=original.apply(this,args);__idleSteps++;return result;};});
    await frame.waitForFunction(()=>__idleSteps>=1200,null,{timeout:180000});check('1,200 idle physics frames under normal rendering',true);
   }
   await drive('before Phone');
   // Wait for reverse coast to settle before the second sequence.
   await frame.waitForFunction(()=>Math.abs(__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed)<.15);
  }
  await tap('#okada-btn-phone');
  await frame.waitForFunction(()=>__capyGame.phone.visible);
  if(fresh)await frame.waitForFunction(()=>__capyGame.tutorial.state==='await_open');
  if(await frame.evaluate(()=>__capyGame.phone.locked)){await tap('.lock-slide');await frame.waitForFunction(()=>!__capyGame.phone.locked);}
  await frame.waitForFunction(()=>!document.querySelector('.phone-screen.home-entering'));
  await tap('.app-icon[data-app="capyfood"]');await frame.waitForFunction(()=>__capyGame.phone.currentApp==='capyfood');
  await page.screenshot({path:path.join(shots,'capy-food.png')});
  if(!fresh){
   // Returning-player offer scheduling fixture only; interaction and physics remain real.
   await frame.evaluate(()=>{const p=__capyGame.phone;p.online=true;p._forceDifficulty='Easy';p._offersPaused=false;p._tryFireOffer();p._offersPaused=true;p.offerTimer=10000;});
  }
  await frame.locator('.btn-offer-accept').waitFor({state:'visible'});await tap('.btn-offer-accept');await page.screenshot({path:path.join(shots,'accepted-order.png')});await tap('#ryder-phone-close');
  check((fresh?'first-time':'returning')+' Accept/Close keeps original live handle',await frame.evaluate(()=>!__capyGame.phone.visible&&!!__capyGame.phone.activeOrder&&__okadaInput===__qaHandle&&__okadaInput.adapter.getEngineInput()===__capyGame.world._lastInput));
  if(fresh)check('natural tutorial reaches teach_controls after Accept',await frame.evaluate(()=>__capyGame.tutorial.state==='teach_controls'&&document.body.classList.contains('tutorial-locked')));
  await drive(fresh?'first-order':'after Phone');
  if(fresh)check('trusted movement releases canonical tutorial freeze',await frame.evaluate(()=>__capyGame.tutorial.state==='mission_in_flight'&&!document.body.classList.contains('tutorial-locked')));
  const events=await frame.evaluate(()=>__qaEvents);console.log('POINTER TRACE',JSON.stringify(events));
  check('trusted pointer acquisition and release recorded',events.some(e=>e.type==='pointerdown'&&e.trusted&&e.button==='okada-btn-throttle')&&events.some(e=>e.type==='pointerdown'&&e.trusted&&e.button==='okada-btn-brake')&&events.some(e=>e.type==='gotpointercapture')&&events.some(e=>e.type==='pointerup'));
  if(!fresh)await runtimeChecks({page,frame,cdp,check,shots});
  await context.close();
 }
 check('zero runtime errors',errors.length===0,errors);
 console.log(`TOTAL ${results.length}/${results.length} PASS`);
}catch(error){console.error(error);throw error;}finally{await browser.close();await new Promise(r=>server.close(r));}
