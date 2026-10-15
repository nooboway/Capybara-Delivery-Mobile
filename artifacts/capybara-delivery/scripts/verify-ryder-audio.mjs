import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=fs.readFileSync(new URL('../public/capybara-game/ryder-audio.js',import.meta.url),'utf8');
let count=0;
function check(name,fn){fn();count++;console.log(`PASS ${name}`);}
function fixture(initial=false){
  const listeners=new Map();let interval;
  class Media {muted=false;volume=.6;plays=0;play(){this.plays++;return this.promise??=Promise.resolve();}}
  const descriptor=Object.getOwnPropertyDescriptor(Media.prototype,'play');
  const drift=new Media();let nativeCalls=0;let state=initial;drift.muted=state;
  const audio={_driftAudio:drift,isMuted:()=>state,setMuted(next){nativeCalls++;state=!!next;drift.muted=state;}};
  const native=audio.setMuted;
  const win={__capyAudio:audio,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:(k,f)=>{if(listeners.get(k)===f)listeners.delete(k);}};
  const ctx=vm.createContext({window:win,HTMLMediaElement:Media,setInterval:f=>(interval=f,1),clearInterval:()=>interval=null});
  vm.runInContext(code,ctx);
  return {Media,descriptor,audio,drift,win,native,ctx,listeners,get calls(){return nativeCalls;},get interval(){return interval;}};
}
const f=fixture(),sfx=new f.Media();sfx.play();
check('play return and single invocation preserved',()=>{assert.equal(sfx.plays,1);assert.equal(sfx.play(),sfx.promise);assert.equal(sfx.plays,2);});
check('existing detached SFX muted without changing volume',()=>{f.audio.setMuted(true);assert.equal(sfx.muted,true);assert.equal(sfx.volume,.6);});
check('native toggle delegated exactly once',()=>assert.equal(f.calls,1));
const newSfx=new f.Media();newSfx.play();
check('new detached SFX muted before native play',()=>assert.equal(newSfx.muted,true));
const localMute=new f.Media();localMute.muted=true;localMute.play();
f.audio.setMuted(false);
check('unmute restores preexisting flags',()=>{assert.equal(sfx.muted,false);assert.equal(newSfx.muted,false);assert.equal(localMute.muted,true);assert.equal(f.drift.muted,false);});
check('no SFX restart on mute/unmute',()=>{assert.equal(sfx.plays,2);assert.equal(newSfx.plays,1);});
f.audio.setMuted(true);f.audio.setMuted(true);f.audio.setMuted(false);
check('repeated mute does not overwrite original flags',()=>assert.equal(sfx.muted,false));
const bridge=f.win.__ryderAudio,wrapped=f.Media.prototype.play;
vm.runInContext(code,f.ctx);
check('script reinjection idempotent',()=>{assert.equal(f.win.__ryderAudio,bridge);assert.equal(f.Media.prototype.play,wrapped);});
f.listeners.get('pagehide')({persisted:true});
check('BFCache pagehide retains bridge',()=>assert.equal(f.win.__ryderAudio.installed,true));
f.listeners.get('pagehide')({persisted:false});
check('final pagehide restores native interfaces',()=>{assert.equal(f.audio.setMuted,f.native);assert.deepEqual(Object.getOwnPropertyDescriptor(f.Media.prototype,'play'),f.descriptor);assert.equal(f.interval,null);assert.equal(f.win.__ryderAudio,undefined);});
const persisted=fixture(true),e=new persisted.Media();e.play();
check('persisted mute silences first played media',()=>assert.equal(e.muted,true));
persisted.audio.setMuted(false);
check('persisted mute can unmute drift and SFX',()=>{assert.equal(persisted.drift.muted,false);assert.equal(e.muted,false);});
persisted.win.__ryderAudio.dispose();
console.log(`TOTAL ${count}/${count} PASS`);
