import {fullDelivery} from './phase2e-runtime-checks.mjs';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import crypto from 'node:crypto';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';import{format}from'node:util';
const require=createRequire(import.meta.url),pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(pkg,'../..');
const evidence=process.env.RYDER_PRODUCT_EVIDENCE_PATH||path.join(repo,'docs/ux/evidence/phase2g-iphone-ux.log'),shots=process.env.RYDER_PRODUCT_SCREENSHOT_DIR||path.join(repo,'docs/ux/screenshots/phase2g');fs.mkdirSync(path.dirname(evidence),{recursive:true});fs.mkdirSync(shots,{recursive:true});fs.writeFileSync(evidence,'');
for(const method of ['log','error']){const original=console[method].bind(console);console[method]=(...args)=>{fs.appendFileSync(evidence,format(...args).trimEnd()+'\n');original(...args);};}
let count=0;const check=(name,ok,data)=>{console.log(ok?'PASS':'FAIL',name,data?JSON.stringify(data):'');if(!ok)throw Error(name);count++;};
const canonical=path.join(pkg,'public/assets/main-CSpZwCDB.js');check('canonical SHA unchanged',crypto.createHash('sha256').update(fs.readFileSync(canonical)).digest('hex').toUpperCase()==='C7E6C0AE11C358DCA1E51B9CC1CB0C971DE97659094E1D8D2C27D81D9AE4682E');
const es=require(path.join(repo,'node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild')),fixtureBundle=path.join(repo,'node_modules/.cache/okada-verify/phase2f-product.js');fs.mkdirSync(path.dirname(fixtureBundle),{recursive:true});es.buildSync({entryPoints:[path.join(pkg,'src/lib/product/index.ts')],bundle:true,format:'iife',globalName:'RyderProduct',outfile:fixtureBundle});
const pw=require('C:/Users/dev/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core');
const browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const errors=[],externalAttempts=[],requests=new Set();let server;
const sizes=[[667,375],[740,360],[780,360],[844,390],[896,414],[932,430],[1080,480],[1366,1024]];
try{
 // Focused presentation fixtures exercise disposal, localization and command
 // dismissal without pretending to execute a real mission or leaderboard.
 const fixture=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});fixture.setDefaultTimeout(10000);fixture.on('pageerror',e=>errors.push(e.message));
 await fixture.setContent(`<style>body{margin:0}#tips-box,#subtitle{position:fixed;top:80px;left:20px;width:280px;background:#123;color:white}#subtitle{top:180px}.capy-controls-panel{position:fixed;top:260px}</style><span id=sylens-badge>old</span><a class=capy-support href="https://buy.stripe.com/dRm14m0u03Zpeol3Gv4Ni00">Support</a><div class=capy-socials><a href="https://x.com/leocooout">X</a></div><div><div class=capy-cine-title>@leocooout presents</div></div><div id=mp-menu-panel style="position:fixed;top:0;right:0;width:240px!important;height:60px!important;display:flex!important"><button class=capy-mbtn>Stats</button></div><div id=tips-box><b data-role=title>Tip</b><span data-role=body>First tip</span></div><div id=subtitle>Press E to enter.</div><div class=capy-controls-panel>Controls</div><div id=phone-hud><div class=app-icon data-app=capyleaderboard>Leaderboard</div></div>`);
 await fixture.addScriptTag({path:fixtureBundle});
 await fixture.evaluate(()=>{const prompt=document.createElement('div');prompt.id='store-prompt';prompt.style.display='none';prompt.innerHTML='<span class="store-prompt-key">E</span><span class="store-prompt-label">Collect</span>';document.body.append(prompt);});
 await fixture.evaluate(()=>{window.openCalls=[];window.originalOpen=window.open=(...args)=>{openCalls.push(args);return null;};window.statsCalls=0;document.documentElement.setAttribute('data-ryder-mobile','');document.querySelector('.capy-mbtn').addEventListener('click',()=>window.open('https://capybara-vibejam26.leocoout.dev/stats'));window.product=RyderProduct.installProductShell(window,document,()=>statsCalls++);});
 check('exact credit in product fixture',await fixture.locator('#sylens-badge').textContent()==='Remixed by Sylens Studios ™');
 check('original creator title and its empty backdrop suppressed',await fixture.locator('.capy-cine-title').evaluate(el=>getComputedStyle(el.parentElement).display==='none'));
 await fixture.locator('[data-ryder-stats]').tap();check('Stats capture replaces original handler',await fixture.evaluate(()=>statsCalls===1&&openCalls.length===0));
 check('support and social hrefs removed',await fixture.locator('.capy-support,.capy-socials a').evaluateAll(els=>els.every(el=>!el.hasAttribute('href')&&getComputedStyle(el.closest('.capy-socials')||el).display==='none')));
 await fixture.evaluate(()=>{window.open('https://capybara-vibejam26.leocoout.dev/stats');window.open('https://example.com/sponsor');window.open('/sponsor?slot=title');});
 check('native/direct promotional window.open cannot escape policy',await fixture.evaluate(()=>openCalls.length===0));
 check('mobile action-aware wording including standalone store keycap',await fixture.locator('#subtitle').textContent().then(t=>t.includes('Tap Action to enter.')&&!t.includes('Press E'))&&await fixture.locator('.store-prompt-key').textContent()==='Tap Action');
 const tips=fixture.locator('#tips-box');await tips.evaluate(el=>el.style.opacity='0');
 check('native auto-hidden tip leaves no invisible close hit target',await tips.locator('.ryder-dismiss-tip').evaluate(el=>getComputedStyle(el).pointerEvents==='none'&&getComputedStyle(el).visibility==='hidden'));
 await tips.evaluate(el=>el.style.opacity='1');await tips.getByRole('button',{name:'Dismiss tip'}).tap();
 check('manual tip dismissal removes presentation and hit target',await tips.evaluate(el=>getComputedStyle(el).display==='none'&&el.inert&&!el.contains(document.elementFromPoint(100,100))));
 await fixture.evaluate(()=>document.querySelector('#tips-box [data-role=body]').textContent='Second tip');await fixture.waitForFunction(()=>!document.getElementById('tips-box').hasAttribute('data-ryder-dismissed'));
 await tips.getByRole('button',{name:'Dismiss tip'}).tap();check('new tip can be dismissed with current signature',await tips.evaluate(el=>el.hasAttribute('data-ryder-dismissed')));
 await fixture.evaluate(()=>{document.querySelector('#tips-box [data-role=body]').textContent='First tip';});await fixture.waitForTimeout(100);
 check('same dismissed tip does not reappear during the session',await tips.evaluate(el=>el.hasAttribute('data-ryder-dismissed')));
 await fixture.locator('.capy-controls-panel').getByRole('button',{name:'Dismiss tip'}).tap();
 check('tutorial help dismisses without any tutorial state API',await fixture.locator('.capy-controls-panel').evaluate(el=>el.inert&&getComputedStyle(el).display==='none'));
 await fixture.evaluate(()=>{document.documentElement.removeAttribute('data-ryder-mobile');document.getElementById('subtitle').textContent='Tap [E] to deliver.';});await fixture.waitForTimeout(100);
 check('desktop action guidance retains E and is idempotent including store keycap',await fixture.locator('#subtitle').textContent().then(t=>t.includes('Press E / Action to deliver.')&&!t.includes('/ Action / Action')&&!t.includes(']'))&&await fixture.locator('.store-prompt-key').textContent()==='E / Action');
 check('Phone session leaderboard entry retained',await fixture.locator('.app-icon[data-app=capyleaderboard]').count()===1);
 await fixture.evaluate(()=>{window.changes=0;window.watch=new MutationObserver(records=>changes+=records.length);watch.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});});await fixture.waitForTimeout(200);
 check('presentation observer settles without a mutation loop',await fixture.evaluate(()=>changes===0));
 await fixture.evaluate(()=>{const view=document.createElement('div');view.id='online-cosmetic-fixture';view.innerHTML='<div id="username-heading">Pick username</div><input value="Ryder"><div><div><button data-color="red">Red</button></div></div><div><button data-style="helmet">Helmet</button><button data-style="crown">Crown</button></div><button>Play</button><button>Back</button>';document.getElementById('mp-menu-panel').append(view);window.originalNameField=view.querySelector('input');});
 await fixture.waitForFunction(()=>document.getElementById('online-cosmetic-fixture').hasAttribute('data-ryder-cosmetics'));
 check('online username heading is not reclassified as helmet-color copy',await fixture.evaluate(()=>!document.getElementById('username-heading').hasAttribute('data-ryder-cosmetic-title')&&document.querySelector('#online-cosmetic-fixture input')===originalNameField&&originalNameField.value==='Ryder'));
 await fixture.evaluate(()=>product.dispose());check('online layout disposal restores the original field and actions',await fixture.evaluate(()=>document.querySelector('#online-cosmetic-fixture > input')===originalNameField&&[...document.querySelectorAll('#online-cosmetic-fixture > button')].map(e=>e.textContent).join(',')==='Play,Back'));
 check('product disposal restores navigation and owned metadata',await fixture.evaluate(()=>window.open===originalOpen&&!document.getElementById('ryder-product-styles')&&!document.querySelector('.ryder-dismiss-tip')&&!document.documentElement.hasAttribute('data-ryder-product')&&!document.querySelector('[data-ryder-stats]')));
 const navBundle=path.join(repo,'node_modules/.cache/okada-verify/phase2g-navigation.js');es.buildSync({entryPoints:[path.join(pkg,'src/lib/navigation/index.ts')],bundle:true,format:'iife',globalName:'RyderNavigation',outfile:navBundle});await fixture.addScriptTag({path:navBundle});
 // Isolated visibility/lifecycle fixture. Real objective navigation is exercised below
 // through native order acceptance and the unmodified full-delivery touch driver.
 await fixture.evaluate(()=>{document.body.classList.add('in-game');const root=document.createElement('div');root.id='okada-phase1-controls-root';root.dataset.state='WORLD';document.body.append(root);window.__capyGame={mode:'world',phone:{phase:'drive-to-store',activeOrder:{customer:'Fixture'},_playerPos:{x:0,z:0,angle:0},_storePos:{x:0,z:10}}};window.navGate=true;window.nav=RyderNavigation.installNavigationHud(window,document,()=>navGate);});
 check('HUD isolated fixture is informational and visible',await fixture.locator('#ryder-navigation').evaluate(e=>!e.hidden&&[e,...e.querySelectorAll('*')].every(n=>getComputedStyle(n).pointerEvents==='none')));
 for(const state of ['BOOT','MENU','SHOP','PHONE','STORE','DISCONNECTED','PORTRAIT']){await fixture.evaluate(state=>document.getElementById('okada-phase1-controls-root').dataset.state=state,state);await fixture.waitForTimeout(150);check('HUD hides in isolated '+state+' state',await fixture.locator('#ryder-navigation').evaluate(e=>e.hidden));}
 await fixture.evaluate(()=>{document.getElementById('okada-phase1-controls-root').dataset.state='WORLD';navGate=false;});await fixture.waitForTimeout(150);check('outer hidden Stats shell gates navigation',await fixture.locator('#ryder-navigation').evaluate(e=>e.hidden));
 await fixture.evaluate(()=>{nav.dispose();nav.dispose();});check('navigation disposal is idempotent and removes its UI',await fixture.evaluate(()=>!document.getElementById('ryder-navigation')&&!document.getElementById('ryder-navigation-styles')&&!document.documentElement.hasAttribute('data-ryder-nav-visible')));
 await fixture.close();
 if(process.env.RYDER_PRODUCT_FIXTURE_ONLY==='1'){console.log(`FIXTURE TOTAL ${count}/${count} PASS (not complete acceptance)`);}
 else{
  const root=path.join(pkg,'dist/public'),mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.woff2':'font/woff2'};
  server=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/'||u==='/stats')u='/index.html';const p=path.resolve(root,'.'+u);if(!p.startsWith(root+path.sep)){r.writeHead(403).end();return;}fs.readFile(p,(e,d)=>{if(e)r.writeHead(404).end();else{r.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}).end(d);}});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('capy.tutorial.completed','2'));
  context.on('request',r=>{const u=new URL(r.url());if(u.protocol==='http:'||u.protocol==='https:'){requests.add(u.origin);if(/leoco+ut|vibejam\.cc|buy\.stripe\.com|x\.com|youtube\.com/i.test(u.hostname))externalAttempts.push(r.url());}});
  await context.route(/https:\/\/(?:[^/]*leoco+ut[^/]*|vibejam\.cc|buy\.stripe\.com|x\.com|www\.youtube\.com)\//,r=>r.abort());
  const page=await context.newPage();page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));const popups=[];page.on('popup',p=>popups.push(p));
  const shot=name=>page.screenshot({path:path.join(shots,name+'.png')});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('iframe').waitFor({state:'attached'});const frame=page.frames().find(f=>f!==page.mainFrame());
  await frame.waitForFunction(()=>!!document.querySelector('[data-role="click"]')&&!!document.querySelector('#ryder-product-styles'));
  const start=await frame.locator('[data-role="click"]').boundingBox();await page.touchscreen.tap(start.x+start.width/2,start.y+start.height/2);
  await frame.getByRole('button',{name:/Play Offline/i}).waitFor({state:'visible'});
  await frame.locator('#capy-loading-screen').waitFor({state:'hidden',timeout:240000});
  await frame.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Play Offline/i.test(b.textContent));if(!b)return false;const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
  check('actual menu credit is exact',await frame.locator('#sylens-badge').textContent()==='Remixed by Sylens Studios ™');
  check('menu logo belongs to Ryder',await frame.locator('#mp-menu-panel > img').evaluateAll(els=>els.some(e=>e.alt==='Ryder'&&e.src.endsWith('/images/ryder-wordmark.svg'))));await shot('menu');await shot('branding');
  check('original heart support entry removed',await frame.locator('.capy-support').evaluateAll(els=>els.every(e=>!e.hasAttribute('href')&&getComputedStyle(e).display==='none')));await shot('support-replacement');
  await page.evaluate(()=>window.__qaOriginalFrame=document.querySelector('iframe'));
  await frame.getByRole('button',{name:'Ryder Stats',exact:true}).tap();await page.waitForURL('**/stats');
  check('Stats opens a local Ryder route',new URL(page.url()).origin===base&&new URL(page.url()).pathname==='/stats'&&await page.getByRole('heading',{name:'Ryder Stats'}).isVisible());
  check('Stats shell has honest coming-soon copy and no fake metrics',await page.locator('.ryder-stats-card').innerText().then(t=>t.includes('Your persistent stats and leaderboard are coming soon.')&&!/\$|rank\s*\d|deliveries\s*\d/i.test(t)));await shot('stats-placeholder');
  await page.getByRole('button',{name:'Back to Game',exact:true}).tap();
  check('Back to Game retains iframe identity',await page.evaluate(()=>document.querySelector('iframe')===__qaOriginalFrame));
  await frame.getByRole('button',{name:/Play Offline/i}).tap();await frame.getByRole('button',{name:'Play',exact:true}).waitFor({state:'visible'});await frame.waitForFunction(()=>__capyGame?._menuGarage&&!__capyGame._menuTransition);await page.waitForTimeout(250);await shot('cosmetic-default');
  const styles=await frame.locator('button[data-style]').evaluateAll(els=>els.map(e=>e.dataset.style));check('all actual cosmetic options enumerated',styles.length===3&&styles.includes('helmet')&&styles.includes('crown')&&styles.includes('witch'),styles);
  for(const[width,height]of sizes){
   await page.setViewportSize({width,height});
   for(const cosmetic of styles){
    await frame.locator(`button[data-style="${cosmetic}"]`).tap();
    const play=frame.getByRole('button',{name:'Play',exact:true}),b=await play.boundingBox();
    const hit=await play.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
    check(`${cosmetic} keeps Play visible/tappable @ ${width}x${height}`,!!b&&b.x>=0&&b.y>=0&&b.width>=44&&b.height>=44&&b.x+b.width<=width+.01&&b.y+b.height<=height+.01&&hit,b);
    const hierarchy=await frame.evaluate(()=>{
      const view=document.querySelector('[data-ryder-cosmetics]'),back=view.querySelector('.ryder-cosmetic-header button'),play=view.querySelector('.ryder-play-footer button'),types=view.querySelector('[data-ryder-types]'),colors=view.querySelector('[data-ryder-colors]');
      const hit=e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.top>=0&&r.right<=innerWidth+.1&&r.bottom<=innerHeight+.1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};
      const t=types.getBoundingClientRect(),c=colors.getBoundingClientRect(),p=play.getBoundingClientRect(),title=view.querySelector('[data-ryder-cosmetic-title]');
      return{back:hit(back),play:hit(play),label:getComputedStyle(colors).display!=='none'||!title||getComputedStyle(title).display==='none',types:[...types.querySelectorAll('button')].every(hit),colors:getComputedStyle(colors).display==='none'||[...colors.querySelectorAll('[data-color]')].every(hit),ordered:getComputedStyle(colors).display==='none'||t.bottom<=c.top+.5,footer:c.bottom<=p.top+.5||getComputedStyle(colors).display==='none'};
    });
    check(`cosmetic hierarchy and all targets ${cosmetic} @ ${width}x${height}`,Object.values(hierarchy).every(Boolean),hierarchy);
    if(width===844){await page.waitForTimeout(250);await shot('cosmetic-'+cosmetic);}
   }
  }
  await frame.locator('[data-style="helmet"]').tap();
  for(const color of await frame.locator('[data-color]').evaluateAll(els=>els.map(e=>e.dataset.color))){await frame.locator(`[data-color="${color}"]`).tap();}
  check('all ten native colors can be selected',await frame.locator('[data-color]').count()===10);await shot('cosmetic-colors');await shot('cosmetic-back-play');
  await frame.getByRole('button',{name:'Back',exact:true}).tap();await frame.getByRole('button',{name:/Play Offline/i}).waitFor({state:'visible'});check('original Back handler returns to native main menu',true);
  await frame.getByRole('button',{name:/Play Offline/i}).tap();await frame.getByRole('button',{name:'Play',exact:true}).waitFor({state:'visible'});await page.waitForTimeout(500);
  await page.setViewportSize({width:844,height:390});await frame.getByRole('button',{name:'Play',exact:true}).tap();await frame.waitForFunction(()=>document.body.classList.contains('in-game')&&__okadaInput?.adapter.isResolved());
  // Presentation-only fixture uses the actual canonical subtitle renderer.
  await frame.evaluate(()=>__capyGame.subtitle.show('Press E to enter.',{duration:10000}));await frame.locator('#subtitle .ryder-dismiss-tip').waitFor({state:'visible'});await shot('tip-visible');await shot('action-prompt');
  check('actual canonical prompt acknowledges mobile Action',await frame.locator('#subtitle').textContent().then(t=>t.includes('Tap Action to enter.')));
  await frame.locator('#subtitle').getByRole('button',{name:'Dismiss tip'}).tap();check('actual subtitle dismissal removes hit target',await frame.locator('#subtitle').evaluate(e=>e.inert&&getComputedStyle(e).display==='none'));await shot('tip-dismissed');
  await frame.locator('#okada-btn-phone').tap();await frame.waitForFunction(()=>__capyGame.phone.visible);
  if(await frame.evaluate(()=>__capyGame.phone.locked)){await frame.locator('.lock-slide').tap();await frame.waitForFunction(()=>!__capyGame.phone.locked);}
  await frame.waitForFunction(()=>!document.querySelector('.phone-screen.home-entering'));
  for(const[width,height]of sizes){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);
   const geometry=await frame.evaluate(()=>{const phone=document.querySelector('#phone-hud'),r=phone.getBoundingClientRect(),close=document.querySelector('#ryder-phone-close'),c=close.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,center:Math.abs(r.x+r.width/2-innerWidth/2),closeHit:close.contains(document.elementFromPoint(c.x+c.width/2,c.y+c.height/2)),noOverlap:c.bottom<=r.top+.01||c.top>=r.bottom-.01||c.right<=r.left+.01||c.left>=r.right-.01,controls:[...document.querySelectorAll('[data-ryder-gameplay]')].every(e=>getComputedStyle(e).visibility==='hidden'&&getComputedStyle(e).pointerEvents==='none'),outerScroll:scrollY};});
   check(`Phone centered/fitted and HUD clear @ ${width}x${height}`,geometry.x>=0&&geometry.y>=0&&geometry.x+geometry.w<=width+.1&&geometry.y+geometry.h<=height+.1&&geometry.center<2&&Math.abs(geometry.h/geometry.w-2)<.02&&geometry.closeHit&&geometry.noOverlap&&geometry.controls&&geometry.outerScroll===0,geometry);await shot(`phone-${width}x${height}`);
  }
  await page.setViewportSize({width:844,height:390});await shot('phone-home');
  await frame.locator('.app-icon[data-app="capymaps"]').tap();
  await frame.waitForFunction(()=>!!__capyGame.phone._mapsApp&&!!document.querySelector('.maps-canvas'));
  for(const [width,height] of [[667,375],[932,430],[844,390]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(500);
    check(`canonical Maps resizes inside portrait Phone @ ${width}x${height}`,await frame.evaluate(()=>{const m=__capyGame.phone._mapsApp,c=document.querySelector('.maps-canvas');return Math.abs(m._w-c.clientWidth)<1&&Math.abs(m._h-c.clientHeight)<1&&c.clientWidth>0&&c.clientHeight>0;}));
  }
  await shot('phone-maps');await frame.locator('#phone-hud .btn-maps-back').tap();
  await frame.locator('.app-icon[data-app="capyfood"]').tap();await frame.waitForFunction(()=>__capyGame.phone.currentApp==='capyfood');await frame.locator('.hero-splash').waitFor({state:'hidden'});
  await frame.evaluate(()=>{const p=__capyGame.phone;p.online=true;p._forceDifficulty='Easy';p._offersPaused=false;p._tryFireOffer();p._offersPaused=true;p.offerTimer=10000;});await frame.locator('.btn-offer-accept').waitFor({state:'visible'});
  await shot('capy-food');
  const scroll=await frame.evaluate(()=>{const body=document.querySelector('.offer-body'),marker=document.createElement('div');marker.textContent='Scrollable presentation fixture';marker.style.height='1000px';body.append(marker);body.scrollTop=500;const result={internal:body.scrollTop>0,outer:scrollY};marker.remove();body.scrollTop=0;return result;});
  check('long Phone content scrolls internally without outer-page movement',scroll.internal&&scroll.outer===0,scroll);
  for(const sel of ['.btn-offer-accept','.btn-offer-skip']){
   const reachable=await frame.locator(sel).evaluate(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});check(sel+' is visible, touch-sized and unobstructed',reachable);
  }
  await frame.locator('.btn-offer-skip').tap();check('native Skip declines offer without creating an order',await frame.evaluate(()=>!__capyGame.phone.activeOrder));
  await frame.evaluate(()=>{const p=__capyGame.phone;p._offersPaused=false;p._tryFireOffer();p._offersPaused=true;p.offerTimer=10000;});await frame.locator('.btn-offer-accept').waitFor({state:'visible'});
  await frame.locator('.btn-offer-accept').tap();check('Capy Food Accept creates canonical order' ,await frame.evaluate(()=>!!__capyGame.phone.activeOrder));await shot('accepted-order');await frame.locator('#ryder-phone-close').tap();await frame.waitForFunction(()=>!__capyGame.phone.visible&&__okadaInput.touch.getUIState()==='WORLD');
  check('Phone close restores neutral live controls',await frame.evaluate(()=>!__okadaInput.state().throttle&&!__okadaInput.touch.capturedPointers.size&&__okadaInput.adapter.getEngineInput()===__capyGame.world._lastInput));
  const gas=await frame.locator('#okada-btn-throttle').boundingBox(),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:gas.x+gas.width/2,y:gas.y+gas.height/2}]});
  try{await frame.waitForFunction(()=>__capyGame.world._bikeTelemetry.getDynamics().forwardSpeed>.5,null,{timeout:15000});check('post-Phone GAS still accelerates actual motorcycle',true);}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await frame.waitForFunction(()=>!document.getElementById('ryder-navigation').hidden);
  await frame.evaluate(()=>__capyGame.subtitle.show('Navigation stays visible with this tip.',{duration:10000}));
  await shot('tip-with-navigation');
  for(const [width,height] of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(200);check(`navigation passive and clear @ ${width}x${height}`,await frame.evaluate(()=>{const e=document.getElementById('ryder-navigation'),r=e.getBoundingClientRect(),m=document.getElementById('okada-steer').getBoundingClientRect();return !e.hidden&&getComputedStyle(e).pointerEvents==='none'&&r.left>=0&&r.right<=innerWidth&&r.bottom<=m.top;}));if(width===667)await shot('compact-navigation');if(width===1366)await shot('tablet-navigation');}
  await page.setViewportSize({width:844,height:390});
  await frame.locator('#okada-btn-phone').tap();await page.waitForTimeout(200);check('active objective navigation hides while Phone open',await frame.locator('#ryder-navigation').evaluate(e=>e.hidden));await frame.locator('#ryder-phone-close').tap();await frame.waitForFunction(()=>!document.getElementById('ryder-navigation').hidden);

  const samples={store:[],customer:[]};
  const observe=async(kind,iteration)=>{
    if(kind==='inside-store'||kind==='complete'){await page.waitForTimeout(200);check('navigation hides '+kind,await frame.locator('#ryder-navigation').evaluate(e=>e.hidden));return;}
    if(iteration%20!==0)return;
    await page.waitForTimeout(150);
    const nav=await frame.evaluate(()=>{const e=document.getElementById('ryder-navigation'),p=__capyGame.phone,t=p.phase==='drive-to-store'?p._storePos:p._deliveryPos,player=p._playerPos,r=e.getBoundingClientRect(),stick=document.getElementById('okada-steer').getBoundingClientRect();return{visible:!e.hidden,phase:e.dataset.phase,distance:Number(e.dataset.distance),expected:Math.hypot(t.x-player.x,t.z-player.z),targetMatch:Number(e.dataset.targetX)===t.x&&Number(e.dataset.targetZ)===t.z,passive:[e,...e.querySelectorAll('*')].every(n=>getComputedStyle(n).pointerEvents==='none'),aboveControl:r.bottom<=stick.top+.5};});
    samples[kind].push(nav.distance);
    if(iteration===0){check('actual '+kind+' navigation matches canonical target and distance',nav.visible&&nav.targetMatch&&Math.abs(nav.distance-nav.expected)<3&&nav.passive&&nav.aboveControl,nav);await shot('navigation-'+kind);}
  };
  const center=async sel=>{const r=await frame.locator(sel).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};};
  await fullDelivery({page,frame,cdp,check,shot,center,observe});
  for(const kind of ['store','customer'])check(kind+' navigation distance changes during real driving',samples[kind].length>1&&Math.max(...samples[kind])-Math.min(...samples[kind])>2,{samples:samples[kind]});
  const links=await frame.locator('a[href]').evaluateAll(els=>els.filter(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width).map(e=>({text:e.textContent,href:e.href})));check('no player-facing original external hrefs remain',!links.some(l=>/leoco+ut|vibejam\.cc|buy\.stripe\.com|x\.com\/leoc|CapyBoyDelivery/.test(l.href)),links);
  check('no external support/Stats/promotional navigation or popup',externalAttempts.length===0&&popups.length===0,{externalAttempts,popups:popups.length});console.log('OBSERVED NETWORK ORIGINS',JSON.stringify([...requests].sort()));
  check('session leaderboard module preserved independently of public Stats',!fs.readFileSync(path.join(pkg,'public/assets/leaderboardApp-jFRwN5VD.js'),'utf8').includes('capybara-vibejam26.leocoout.dev/stats'));
  await context.close();
 }
 check('zero runtime exceptions',errors.length===0,errors);console.log(`TOTAL ${count}/${count} PASS`);
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
