import{createRequire}from'node:module';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';
const require=createRequire(import.meta.url),pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(pkg,'../..'),out=path.join(repo,'node_modules/.cache/okada-verify/navigation.cjs');
require(path.join(repo,'node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild')).buildSync({entryPoints:[path.join(pkg,'src/lib/navigation/adapter.ts')],bundle:true,platform:'node',format:'cjs',outfile:out});
const{RyderNavigationAdapter}=require(out),adapter=new RyderNavigationAdapter();let n=0;
function check(name,fn){fn();console.log('PASS',name);n++;}
const phone={phase:'drive-to-store',activeOrder:{customer:'Customer',destination:'Canal'},_playerPos:{x:0,z:0,angle:0},_storePos:{x:0,z:10},_deliveryPos:{x:20,z:0},_mapRoads:[{kind:'asphalt',points:[[0,0],[0,10]]}],_mapRoute:[{x:0,z:0},{x:0,z:10}]};
const game={mode:'world',phone};const initial=JSON.stringify(game);
check('pickup target is actual canonical store',()=>{const s=adapter.read(game);assert.deepEqual(s.target,{x:0,z:10});assert.equal(s.distance,10);assert.equal(s.label,'Grocery pickup');assert.equal(s.relativeBearing,0);});
check('right bearing and heading are relative',()=>{const s=adapter.read({...game,phone:{...phone,_storePos:{x:10,z:0}}});assert.equal(s.relativeBearing,Math.PI/2);const h=adapter.read({...game,phone:{...phone,_storePos:{x:10,z:0},_playerPos:{x:0,z:0,angle:Math.PI/2}}});assert.equal(h.relativeBearing,0);});
check('delivery target and label follow canonical phase',()=>{const s=adapter.read({...game,phone:{...phone,phase:'delivering'}});assert.deepEqual(s.target,{x:20,z:0});assert.equal(s.distance,20);assert.equal(s.label,'Customer · Canal');});
check('idle rejects stale route and destinations',()=>assert.equal(adapter.read({...game,phone:{...phone,phase:'idle'}}),null));
check('no active order rejects stale destinations',()=>assert.equal(adapter.read({...game,phone:{...phone,activeOrder:null}}),null));
check('store mode hides stale outdoor position',()=>assert.equal(adapter.read({...game,mode:'store'}),null));
check('invalid and unavailable scalars safely hide',()=>{for(const angle of[NaN,Infinity,undefined])assert.equal(adapter.read({...game,phone:{...phone,_playerPos:{x:0,z:0,angle}}}),null);assert.equal(adapter.read(undefined),null);});
check('copied geometry owns no canonical point objects',()=>{const s=adapter.read(game);assert.notEqual(s.route[0],phone._mapRoute[0]);assert.notEqual(s.roads[0].points[0],phone._mapRoads[0].points[0]);assert.deepEqual(s.roads[0].points[1],{x:0,z:10});});
check('missing geometry retains honest direct guidance',()=>{const s=adapter.read({...game,phone:{...phone,_mapRoads:undefined,_mapRoute:null}});assert.equal(s.distance,10);assert.equal(s.roads.length,0);assert.equal(s.route.length,0);});
check('bounded nonfinite geometry',()=>{const s=adapter.read({...game,phone:{...phone,_mapRoads:Array.from({length:300},()=>({points:Array.from({length:200},(_,i)=>[i,i])})),_mapRoute:Array.from({length:200},()=>({x:1,z:1}))}});assert.ok(s.roads.length<=256);assert.ok(s.roads.flatMap(r=>r.points).length<=12000);assert.equal(s.route.length,128);});
check('adapter does not mutate canonical state',()=>assert.equal(JSON.stringify(game),initial));
console.log(`TOTAL ${n}/${n} PASS`);
