import fs from 'node:fs';import path from 'node:path';
export async function runtimeChecks({page,frame,cdp,check,shots}){
 fs.mkdirSync(shots,{recursive:true});
 const shot=name=>page.screenshot({path:path.join(shots,name+'.png')});
 const center=async sel=>{const b=await frame.locator(sel).boundingBox();if(!b)throw Error('Missing '+sel);return{x:b.x+b.width/2,y:b.y+b.height/2};};
 if(process.env.RYDER_ROUTE_ONLY==='1'){
  console.log('DEBUG route-only run; not the complete acceptance suite');
  await fullDelivery({page,frame,cdp,check,shot,center});return;
 }
 const tap=async sel=>{await page.touchscreen.tap(...Object.values(await center(sel)));await page.waitForTimeout(200);};
 const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 for(const[width,height]of[[667,375],[740,360],[780,360],[844,390],[896,414],[932,430],[1080,480],[1366,1024]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const audit=await frame.evaluate(()=>{
   const ids=['okada-btn-throttle','okada-btn-brake','okada-btn-drift','okada-btn-interact','okada-steer','okada-btn-phone','btn-menu','btn-mute'];
   return ids.map(id=>{const el=document.getElementById(id),b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{id,w:b.width,h:b.height,hit:hit?.closest('#'+id)?.id,inside:b.left>=0&&b.top>=0&&b.right<=innerWidth+.01&&b.bottom<=innerHeight+.01};});
  });
  check(`all eight hit targets @ ${width}x${height}`,audit.every(b=>b.hit===b.id&&b.w>=44&&b.h>=44&&b.inside),audit);await shot(`world-${width}x${height}`);
 }
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
 await page.evaluate(()=>{const p=document.querySelector('#ryder-parent-safe-probe');window.__qaSafeCss=p.style.cssText;p.style.padding='0px 44px 21px 44px';});
 await frame.evaluate(()=>dispatchEvent(new Event('resize')));
 check('outer-page safe areas are converted into iframe control bounds',await frame.evaluate(()=>{const ids=['okada-steer','okada-btn-throttle','okada-btn-brake','okada-btn-drift','okada-btn-interact','ryder-top-hud'];return ids.every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=44&&r.right<=innerWidth-44+.01&&r.bottom<=innerHeight-21+.01;});}));await shot('landscape-physical-insets');
 await page.evaluate(()=>document.querySelector('#ryder-parent-safe-probe').style.cssText=__qaSafeCss);await frame.evaluate(()=>dispatchEvent(new Event('resize')));
 const native=await frame.evaluate(()=>[...document.querySelectorAll('#mobile-controls,#mobile-joystick,[id^="btn-touch-"]')].every(el=>getComputedStyle(el).display==='none'&&getComputedStyle(el).pointerEvents==='none'));
 check('canonical gameplay touch presentation and hit ownership suppressed',native);
 await frame.locator('#btn-menu').tap();await frame.waitForFunction(()=>__okadaInput.touch.getUIState()==='MENU');
 await page.waitForTimeout(350);
 check('Menu confirmation survives the retargeted compatibility click',await frame.evaluate(()=>__okadaInput.touch.getUIState()==='MENU'&&!!document.querySelector('.capy-confirm-overlay.visible')));
 check('Menu confirmation neutralizes and hides gameplay controls',await frame.evaluate(()=>[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).visibility==='hidden'&&getComputedStyle(e).pointerEvents==='none')&&!__okadaInput.touch.capturedPointers.size));
 await shot('menu-confirmation-no-controls');await frame.locator('.capy-confirm-btn:not(.primary)').tap();await frame.waitForFunction(()=>__okadaInput.touch.getUIState()==='WORLD');
 check('trusted Menu cancel returns to neutral live WORLD',await frame.evaluate(()=>!__okadaInput.state().throttle&&!__okadaInput.state().steer));
 const s=await center('#okada-steer'),g=await center('#okada-btn-throttle'),d=await center('#okada-btn-drift');
 const before=await frame.evaluate(()=>({yaw:__capyGame.world._bikeTelemetry.getDynamics().yaw,x:__capyGame.world.playerGroup.position.x,z:__capyGame.world.playerGroup.position.z}));
 await touch('touchStart',[{id:10,...s},{id:11,...g},{id:12,...d}]);
 await touch('touchMove',[{id:10,x:s.x+36,y:s.y-24},{id:11,...g},{id:12,...d}]);await page.waitForTimeout(1500);
 const multi=await frame.evaluate(()=>({state:__okadaInput.state(),yaw:__capyGame.world._bikeTelemetry.getDynamics().yaw,speed:__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed,x:__capyGame.world.playerGroup.position.x,z:__capyGame.world.playerGroup.position.z,shift:__capyGame.world._lastInput.shift}));
 check('steer + GAS + DRIFT simultaneously reach canonical controller',multi.state.steer>.5&&multi.state.throttle===1&&multi.state.drift&&multi.shift,multi);
 check('steering changes actual motorcycle direction while travelling',Math.abs(multi.yaw-before.yaw)>.01&&Math.hypot(multi.x-before.x,multi.z-before.z)>.05,{before,...multi});await shot('active-joystick-and-right-cluster');
 // CDP touchEnd lists the points being released, not the remaining points.
 await touch('touchEnd',[{id:12,...d}]);
 check('releasing DRIFT preserves other owners',await frame.evaluate(()=>!__okadaInput.state().drift&&__okadaInput.state().throttle===1&&__okadaInput.state().steer>0));
 await touch('touchEnd',[]);
 await touch('touchStart',[{id:13,...g}]);
 await tap('#okada-btn-phone');
 check('Phone hides and neutralizes every gameplay target',await frame.evaluate(()=>[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).pointerEvents==='none'&&getComputedStyle(e).visibility==='hidden')&&!__okadaInput.state().throttle&&!__okadaInput.touch.capturedPointers.size));
 await touch('touchEnd',[]);await shot('phone-open');await tap('#ryder-phone-close');
 await frame.evaluate(()=>{window.__qaHealth=__okadaInput.touch.bindingHealthy;__okadaInput.touch.setBindingHealth(()=>false);});
 check('DISCONNECTED cannot render or acquire gameplay controls',await frame.evaluate(()=>__okadaInput.touch.getUIState()==='DISCONNECTED'&&[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).visibility==='hidden'&&getComputedStyle(e).pointerEvents==='none')));
 await frame.evaluate(()=>__okadaInput.touch.setBindingHealth(__qaHealth));await frame.waitForFunction(()=>__okadaInput.touch.getUIState()==='WORLD');
 await touch('touchStart',[{id:14,...s},{id:15,...g}]);await touch('touchMove',[{id:14,x:s.x+30,y:s.y},{id:15,...g}]);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});await page.waitForTimeout(200);
 check('portrait blocks all gameplay and clears pointers',await frame.evaluate(()=>__okadaInput.touch.getUIState()==='PORTRAIT_BLOCKED'&&!__okadaInput.state().throttle&&!__okadaInput.touch.capturedPointers.size));await shot('portrait-blocked');
 await touch('touchEnd',[]);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
 await cdp.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});await page.waitForTimeout(200);
 check('landscape restore is neutral until a new physical gesture',await frame.evaluate(()=>__okadaInput.touch.getUIState()==='WORLD'&&!__okadaInput.state().steer&&!__okadaInput.state().throttle));
 await frame.evaluate(()=>{window.__qaPhysicsFrames=0;const w=__capyGame.world,original=w._stepPhysics;w._stepPhysics=function(...args){const result=original.apply(this,args);__qaPhysicsFrames++;return result;};});
 const start=await frame.evaluate(()=>__qaPhysicsFrames);await frame.waitForFunction(n=>__qaPhysicsFrames>=n,start+1200,{timeout:180000});
 check('1,200 physics frames after order flow under normal rendering',await frame.evaluate(n=>__qaPhysicsFrames-n>=1200,start));
 await fullDelivery({page,frame,cdp,check,shot,center});
 await frame.evaluate(()=>{__okadaInput.touch.detach();__okadaInput.touch.detach();});
 check('idempotent disposal releases controls, observers, timers and native UI ownership',await frame.evaluate(()=>{const t=__okadaInput.touch;return !t.attached&&t.frame===null&&t.brakeTimer===null&&t.observer===null&&t.abort===null&&!t.capturedPointers.size&&!document.querySelector('#okada-phase1-controls-root')&&!document.documentElement.hasAttribute('data-ryder-mobile')&&document.querySelector('#btn-menu').parentElement.id==='top-right-controls'&&!__okadaInput.state().throttle;}));
 check('disposal removes outer-document geometry probe',await page.evaluate(()=>!document.querySelector('#ryder-parent-safe-probe')));
 // Exercise the real React iframe onLoad lifecycle, preserving the old handle
 // only as a test probe. Do not call initOkadaInput or rebind from the test.
 await page.evaluate(()=>window.__oldRyder=document.querySelector('iframe').contentWindow.__okadaInput);
 await frame.goto(frame.url(),{waitUntil:'domcontentloaded'});
 await frame.waitForFunction(()=>!!document.querySelector('#okada-phase1-controls-root'));
 check('iframe reload disposes old source and owners',await page.evaluate(()=>!__oldRyder.touch.attached&&__oldRyder.touch.capturedPointers.size===0&&__oldRyder.touch.buttonOwners.size===0));
 check('iframe generation B has no prematurely visible controls',await frame.evaluate(()=>[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).visibility==='hidden')));await shot('reload-menu-no-controls');
}

async function fullDelivery({page,frame,cdp,check,shot,center}){
 let touching=false;
 const send=async(type,touchPoints)=>{
  if(type==='touchEnd'&&!touching)return;
  await cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  if(type==='touchStart')touching=true;
  if(type==='touchEnd'&&!touchPoints.length)touching=false;
 };
 const end=()=>send('touchEnd',[]);
 const action=async (predicate,arg=null)=>{
  const a=await center('#okada-btn-interact');await send('touchStart',[{id:80,...a}]);
  try{await frame.waitForFunction(predicate,arg,{timeout:10000});}finally{await end();}
 };
 // Navigation is entirely trusted touch. No position, velocity, mission state,
 // collected flag, basket, input manager or canonical engine object is assigned.
 async function ride(kind){
  let active='',stuck=0,lastDistance=Infinity;
  const stick=await center('#okada-steer'),gas=await center('#okada-btn-throttle'),brake=await center('#okada-btn-brake');
  const start=Date.now();
  try{
   for(let iteration=0;Date.now()-start<360000;iteration++){
    const v=await frame.evaluate(kind=>{const game=__capyGame,w=game.world,d=w._bikeTelemetry.getDynamics(),p=w.playerGroup.position,t=kind==='store'?w.getStoreMarkerPos():game._deliveryPos;return{x:p.x,z:p.z,yaw:d.yaw,speed:d.forwardSpeed,target:{x:t.x,z:t.z},route:game.phone._mapRoute?.map(p=>({x:p.x,z:p.z}))??[]};},kind);
    const distance=Math.hypot(v.target.x-v.x,v.target.z-v.z);
    if(distance<3.3){
     await end();if(v.speed>.3){await send('touchStart',[{id:72,...brake}]);await frame.waitForFunction(()=>Math.abs(__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed)<.3,null,{timeout:10000});await end();}
     console.log('RIDE arrived',kind,{distance,elapsed:Date.now()-start});return;
    }
    let target=v.target;
    if(v.route.length){let nearest=0,dist=Infinity;for(let i=0;i<v.route.length;i++){const d=Math.hypot(v.route[i].x-v.x,v.route[i].z-v.z);if(d<dist){nearest=i;dist=d;}}
     target=v.route[nearest];while(nearest<v.route.length-1&&Math.hypot(target.x-v.x,target.z-v.z)<5)target=v.route[++nearest];
    }
    let error=Math.atan2(target.x-v.x,target.z-v.z)-v.yaw;error=Math.atan2(Math.sin(error),Math.cos(error));
    const desired=distance<12?2.1:Math.abs(error)>.7?3:8;
    const next=v.speed>desired+.5?'brake':'gas';
    if(next!==active){await end();await send('touchStart',[{id:70,...stick},{id:71,...(next==='gas'?gas:brake)}]);active=next;}
    const steer=Math.max(-1,Math.min(1,-error*1.5));await send('touchMove',[{id:70,x:stick.x+steer*60,y:stick.y},{id:71,...(next==='gas'?gas:brake)}]);
    if(iteration%20===0)console.log('RIDE',kind,{distance,error,speed:v.speed,route:v.route.length});
    if(Math.abs(lastDistance-distance)<.03&&Math.abs(v.speed)<.1)stuck++;else stuck=0;lastDistance=distance;
    if(stuck>25){
     console.log('RIDE reverse recovery',kind,{distance});await end();
     await send('touchStart',[{id:70,...stick},{id:71,...brake}]);
     await send('touchMove',[{id:70,x:stick.x-steer*40,y:stick.y},{id:71,...brake}]);
     await page.waitForTimeout(1800);await end();active='';stuck=0;
    }
    await page.waitForTimeout(100);
   }
   throw Error(`Touch navigation timed out en route to ${kind}`);
  }finally{await end();}
 }
 await ride('store');await action(()=>__capyGame.mode==='store');await frame.waitForFunction(()=>__capyGame.store.isActive&&__okadaInput.touch.getUIState()==='STORE');
 check('trusted driving and ACTION enter the assigned canonical store',true);await shot('store-entry');
 check('store ACTION and shared HUD are unobstructed by shopping list/timer',await frame.evaluate(()=>['okada-btn-interact','okada-btn-phone','btn-menu','btn-mute'].every(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('#'+id)===e;})));
 const stick=await center('#okada-walk');
 await send('touchStart',[{id:81,...stick}]);await send('touchMove',[{id:81,x:stick.x+40,y:stick.y-40}]);
 const before=await frame.evaluate(()=>({x:__capyGame.store.walkerPos.x,z:__capyGame.store.walkerPos.z}));await page.waitForTimeout(250);await shot('store-joystick-active');await end();await frame.waitForFunction(()=>Math.hypot(__capyGame.store.walkerVel.x,__capyGame.store.walkerVel.z)<.1,null,{timeout:3000});
 const walk=await frame.evaluate(()=>({x:__capyGame.store.walkerPos.x,z:__capyGame.store.walkerPos.z,vx:__capyGame.store.walkerVel.x,vz:__capyGame.store.walkerVel.z,state:__okadaInput.state()}));
 check('store diagonal movement is real and release stops naturally',Math.abs(walk.x-before.x)>.01&&Math.abs(walk.z-before.z)>.01&&Math.hypot(walk.vx,walk.vz)<.1&&walk.state.walkX===0&&walk.state.walkY===0,walk);await shot('store-movement');
 async function walkTo(target,radius){
  const data=await frame.evaluate(()=>({p:{x:__capyGame.store.walkerPos.x,z:__capyGame.store.walkerPos.z},bounds:__capyGame.store.bounds,boxes:__capyGame.store.colliders.map(c=>({x:c.x,z:c.z,hw:c.hw,hd:c.hd}))}));
  const route=walkingRoute(data,target,radius);console.log('WALK route',{target,waypoints:route.length});
  // Closed-loop thumb control compensates for the canonical store's inertia.
  // Read primitive velocity only; do not assign velocity or modify the policy.
  for(const point of route){
   await send('touchStart',[{id:82,...stick}]);
   try{const start=Date.now();for(;;){
    const p=await frame.evaluate(()=>({x:__capyGame.store.walkerPos.x,z:__capyGame.store.walkerPos.z,vx:__capyGame.store.walkerVel.x,vz:__capyGame.store.walkerVel.z}));
    const dx=point.x-p.x,dz=point.z-p.z,dist=Math.hypot(dx,dz);
    if(dist<.10)break;
    if(Date.now()-start>7000){console.log('WALK stuck',{point,p,target},await frame.evaluate(()=>({state:__okadaInput.state(),ui:__okadaInput.touch.getUIState(),owner:__okadaInput.touch.walkOwner,walk:__capyGame.world._lastInput.walkVec})));throw Error('Store touch navigation stuck');}
    const speed=Math.min(2,dist*3),vx=dist?dx/dist*speed:0,vz=dist?dz/dist*speed:0;
    const ax=(vx-p.vx)*8/45,az=(vz-p.vz)*8/45,mag=Math.min(1,Math.hypot(ax,az)),length=Math.hypot(ax,az);
    const throwSize=mag<.0001?0:(.18+.82*mag)*60;
    await send('touchMove',[{id:82,x:stick.x+(length?ax/length*throwSize:0),y:stick.y+(length?az/length*throwSize:0)}]);await page.waitForTimeout(40);
   }}finally{await end();await frame.waitForFunction(()=>Math.hypot(__capyGame.store.walkerVel.x,__capyGame.store.walkerVel.z)<.1,null,{timeout:3000});}
  }
 }
 const cart=await frame.evaluate(()=>__capyGame.store.cartPickupPos);await walkTo(cart,.7);await action(()=>__capyGame.store.hasCart);check('cart acquired with actual ACTION touch',true);
 for(let n=0;n<20;n++){
  const target=await frame.evaluate(()=>{const s=__capyGame.store,name=s.remainingItems[0],item=s.shelfItems.find(i=>!i.collected&&i.type.name===name);return item?{name,x:item.mesh.position.x,z:item.mesh.position.z}:null;});
  if(!target)break;await walkTo(target,1.05);const prior=await frame.evaluate(()=>__capyGame.store.cart.length);await action(n=>__capyGame.store.cart.length>n,prior);console.log('COLLECT',target.name);
 }
 check('actual required items all collected',await frame.evaluate(()=>__capyGame.store.allCollected));
 if(await frame.evaluate(()=>__capyGame.mode==='store')){const exit=await frame.evaluate(()=>__capyGame.store.exitPos);await walkTo(exit,.8);await action(()=>__capyGame.mode==='world');}await frame.waitForFunction(()=>__okadaInput.touch.getUIState()==='WORLD');
 check('store exit restores live world controls',true);await ride('customer');
 const count=await frame.evaluate(()=>__capyGame.phone.deliveryCount);await action(()=>__capyGame._missionPhase==='idle');
 check('touch-only full canonical delivery completes and awards result',await frame.evaluate(n=>__capyGame.phone.deliveryCount>n,count));await shot('delivery-complete');
}

function walkingRoute({p,bounds,boxes},target,radius){
 const step=.3,minX=bounds.minX+.41,minZ=bounds.minZ+.41,nx=Math.floor((bounds.maxX-.41-minX)/step)+1,nz=Math.floor((bounds.maxZ-.41-minZ)/step)+1;
 const point=i=>({x:minX+(i%nx)*step,z:minZ+Math.floor(i/nx)*step});
 const valid=i=>{if(i<0||i>=nx*nz)return false;const q=point(i);return !boxes.some(b=>Math.abs(q.x-b.x)<b.hw+.46&&Math.abs(q.z-b.z)<b.hd+.46);};
 let start=0,best=Infinity;for(let i=0;i<nx*nz;i++){if(!valid(i))continue;const q=point(i),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<best){start=i;best=d;}}
 const queue=[start],parent=new Map([[start,-1]]);let end=-1;
 for(let at=0;at<queue.length;at++){const i=queue[at],q=point(i);if(Math.hypot(q.x-target.x,q.z-target.z)<radius){end=i;break;}const x=i%nx,z=Math.floor(i/nx);
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=x+dx,zz=z+dz,j=zz*nx+xx;if(xx<0||zz<0||xx>=nx||zz>=nz||parent.has(j)||!valid(j))continue;if(dx&&dz&&(!valid(z*nx+xx)||!valid(zz*nx+x)))continue;parent.set(j,i);queue.push(j);}
 }
 if(end<0)throw Error('No walkable route to '+JSON.stringify(target));const route=[];for(let i=end;i!==-1;i=parent.get(i))route.push(point(i));route.reverse();
 // Preserve collision-safe turns but avoid stopping at every 30 cm grid cell.
 return route.filter((p,i)=>i===0||i===route.length-1||Math.abs((p.x-route[i-1].x)*(route[i+1].z-p.z)-(p.z-route[i-1].z)*(route[i+1].x-p.x))>.0001);
}
