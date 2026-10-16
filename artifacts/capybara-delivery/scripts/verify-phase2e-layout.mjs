import{createRequire}from'node:module';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';import assert from'node:assert/strict';
const require=createRequire(import.meta.url),pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(pkg,'../..'),tmp=path.join(repo,'node_modules/.cache/okada-verify/phase2e');
fs.mkdirSync(tmp,{recursive:true});const es=require(path.join(repo,'node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild'));
for(const name of ['layout','state'])es.buildSync({entryPoints:[path.join(pkg,'src/lib/input/mobile',name+'.ts')],bundle:true,platform:'node',format:'cjs',outfile:path.join(tmp,name+'.cjs')});
const{resolveLayout}=require(path.join(tmp,'layout.cjs')),{resolveMobileState}=require(path.join(tmp,'state.cjs'));let n=0;
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
for(const[w,h]of[[667,375],[740,360],[780,360],[844,390],[896,414],[932,430],[1080,480],[1366,1024]]){
 for(const safe of [{top:14,right:20,bottom:18,left:20},{top:14,right:44,bottom:21,left:44}]){
  for(const store of [false,true]){const l=resolveLayout(w,h,safe,store),buttons=store?[l.action,l.hud]:[l.gas,l.brakeReverse,l.drift,l.action,l.hud];
  for(const b of buttons){assert.ok(b.width>=44&&b.height>=44);assert.ok(b.x>=safe.left&&b.y>=safe.top&&b.x+b.width<=w-safe.right+.001&&b.y+b.height<=h-safe.bottom+.001);}
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)assert.equal(overlap(buttons[i],buttons[j]),false,`${w}x${h} collision ${i}/${j}`);
  if(store){assert.ok(l.hud.x===safe.left);assert.ok(l.action.y>h*.6);}else{assert.ok(l.gas.width>l.brakeReverse.width);assert.ok(l.movement.x+l.movement.width<l.brakeReverse.x);}n++;}
 }
 console.log('PASS layout bounds, safe area, targets and collisions',w,h);
}
const base={booted:true,inGame:true,menu:false,portrait:false,shop:false,phone:false,store:false,bound:true};
for(const[state,patch]of Object.entries({WORLD:{},STORE:{store:true},PHONE:{phone:true},SHOP:{shop:true},PORTRAIT_BLOCKED:{portrait:true},MENU:{inGame:false},BOOT:{booted:false},DISCONNECTED:{bound:false}})){assert.equal(resolveMobileState({...base,...patch}),state);n++;console.log('PASS state',state);}
assert.equal(resolveMobileState({...base,phone:true,bound:false}),'DISCONNECTED');n++;
console.log(`TOTAL ${n}/${n} PASS`);
