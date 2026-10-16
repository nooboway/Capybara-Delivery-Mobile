import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(pkg,'../..');
const out=path.join(repo,'node_modules/.cache/okada-verify/tutorial-bridge.cjs');
fs.mkdirSync(path.dirname(out),{recursive:true});
require(path.join(repo,'node_modules/.pnpm/esbuild@0.18.20/node_modules/esbuild')).buildSync({entryPoints:[path.join(pkg,'src/lib/input/tutorial-bridge.ts')],bundle:true,platform:'node',format:'cjs',outfile:out});
const {acknowledgePhoneOpen,acknowledgeDrivingGesture}=require(out);
let count=0;
function check(name,fn){fn();count++;console.log('PASS',name);}
function fixture(state){let calls=[];const tutorial={state,_commandDone:(s,next)=>{calls.push(s);next();},_enterPhoneBoot:()=>{calls.push('boot');tutorial.state='phone_boot';},_enterMissionInFlight:()=>{calls.push('drive');tutorial.state='mission_in_flight';}};return{win:{__capyGame:{tutorial,phone:{visible:true,_tabDisabled:false}}},tutorial,calls};}
check('Phone uses canonical command and boot transitions',()=>{const f=fixture('await_tab');acknowledgePhoneOpen(f.win);assert.deepEqual(f.calls,['await_tab','boot']);});
check('Phone cannot bypass cinematic',()=>{const f=fixture('intro_cinematic');acknowledgePhoneOpen(f.win);assert.equal(f.calls.length,0);});
check('disabled Phone cannot advance tutorial',()=>{const f=fixture('await_tab');f.win.__capyGame.phone._tabDisabled=true;acknowledgePhoneOpen(f.win);assert.equal(f.calls.length,0);});
check('closed Phone cannot advance tutorial',()=>{const f=fixture('await_tab');f.win.__capyGame.phone.visible=false;acknowledgePhoneOpen(f.win);assert.equal(f.calls.length,0);});
check('trusted driving gesture enters mission through canonical transition',()=>{const f=fixture('teach_controls');acknowledgeDrivingGesture(f.win,{isTrusted:true});assert.deepEqual(f.calls,['drive']);});
check('untrusted pointer cannot unlock tutorial',()=>{const f=fixture('teach_controls');acknowledgeDrivingGesture(f.win,{isTrusted:false});assert.equal(f.calls.length,0);});
check('driving cannot skip earlier tutorial states',()=>{for(const state of ['intro_cinematic','welcome','await_tab','phone_boot','await_open','await_offer']){const f=fixture(state);acknowledgeDrivingGesture(f.win,{isTrusted:true});assert.equal(f.calls.length,0);}});
check('repeat gesture leaves mission unchanged',()=>{const f=fixture('teach_controls');acknowledgeDrivingGesture(f.win,{isTrusted:true});acknowledgeDrivingGesture(f.win,{isTrusted:true});assert.deepEqual(f.calls,['drive']);});
check('absent runtime is harmless',()=>{acknowledgePhoneOpen(null);acknowledgeDrivingGesture(null,{isTrusted:true});});
console.log(`TOTAL ${count}/${count} PASS`);
