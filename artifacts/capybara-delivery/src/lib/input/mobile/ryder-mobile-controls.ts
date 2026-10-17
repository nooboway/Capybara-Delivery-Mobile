import type { OkadaInputManager } from "../input-manager";
import type { InputContribution } from "../types";
import { readForwardSpeed } from "../vehicle-state";
import { acknowledgeDrivingGesture,acknowledgePhoneOpen } from "../tutorial-bridge";
import { FloatingJoystick } from "./floating-joystick";
import { PointerButton } from "./pointer-button";
import { suppressNativeTouch } from "./native-suppression";
import { resolveLayout,place,type Insets } from "./layout";
import { resolveMobileState,isPlayable,type MobileUIState } from "./state";
import { MOBILE_STYLES } from "./styles";
import { RYDER_CREDIT } from "../../product/copy";

export const GAS_LOCK_ENABLED=false,GAS_LOCK_HOLD_MS=1000;
export const BRAKE_REVERSE_ENTER_SPEED=.15,BRAKE_REENTER_SPEED=.4,BRAKE_REVERSE_POLL_MS=60;
export const STICK_IDLE_OPACITY=0,STICK_ACTIVE_OPACITY=.85;
type Mode="driving"|"store";
type Game={mode?:string;tutorial?:{state?:string};phone?:{visible?:boolean;_tabDisabled?:boolean;show?:()=>void;hide?:()=>void;minimize?:()=>void;revealRoot?:()=>void};};

/** Sole mobile gameplay surface. Components own pointers; the manager owns
 * semantic intent; EngineAdapter remains the only gameplay input bridge.
 */
export class RyderMobileControls {
  private root:HTMLDivElement|null=null;
  private hud:HTMLDivElement|null=null;
  private abort:AbortController|null=null;
  private observer:MutationObserver|null=null;
  private restoreNative:(()=>void)|null=null;
  private restoredHUD:Array<{button:HTMLElement;marker:Comment}>=[];
  private buttons:PointerButton[]=[];
  private hudResetters:Array<()=>void>=[];
  private steer:FloatingJoystick|null=null;
  private walk:FloatingJoystick|null=null;
  private contribution:InputContribution={};
  private state:MobileUIState="BOOT";
  private mode:Mode="driving";
  private lastStoreClass=false;
  private attached=false;
  private frame:number|null=null;
  private brakeTimer:ReturnType<typeof setInterval>|null=null;
  private reversing=false;
  private viewportProbe:HTMLDivElement|null=null;
  private parentSafeProbe:HTMLDivElement|null=null;
  private compatibilityClick:{x:number;y:number;until:number}|null=null;
  private portraitBarrier:HTMLDivElement|null=null;
  private shop:HTMLDivElement|null=null;
  private phoneButton:HTMLButtonElement|null=null;
  private closeButton:HTMLButtonElement|null=null;
  readonly buttonOwners=new Map<string,Set<number>>();
  readonly capturedPointers=new Map<number,Element>();
  readonly isGasLocked=false;
  get steerOwner(){return this.steer?.owner??null;}
  get walkOwner(){return this.walk?.owner??null;}
  constructor(private doc:Document,private manager:OkadaInputManager,private bindingHealthy:()=>boolean=()=>false){}
  private get win(){return this.doc.defaultView;}
  private get game(){return (this.win as unknown as {__capyGame?:Game}|null)?.__capyGame;}
  getMode():Mode{return this.mode;}
  getGasLocked():boolean{return false;}
  getUIState():MobileUIState{return this.state;}
  clearGasLock():void{/* Phase 2E intentionally removes the hidden hold-to-latch gesture. */}
  setMode(mode:Mode):void{if(this.mode!==mode){this.mode=mode;this.reset("mode");}this.refresh();}
  setBindingHealth(read:()=>boolean):void{this.bindingHealthy=read;this.refresh();}

  attach():void {
    if(this.attached)return;
    this.attached=true;this.abort=new AbortController();const signal=this.abort.signal;
    const style=this.doc.createElement("style");style.id="okada-phase1-controls-style";style.textContent=MOBILE_STYLES;this.doc.head.append(style);
    this.root=this.doc.createElement("div");this.root.id="okada-phase1-controls-root";this.root.dataset.ryderControls="native";this.root.dataset.state="BOOT";this.doc.body.append(this.root);
    this.viewportProbe=this.doc.createElement("div");
    this.viewportProbe.style.cssText="position:fixed;visibility:hidden;pointer-events:none;padding:var(--okada-safe-top) var(--okada-safe-right) var(--okada-safe-bottom) var(--okada-safe-left)";this.doc.body.append(this.viewportProbe);
    try{
      const parent=this.win?.parent;
      if(parent&&parent!==this.win){
        this.parentSafeProbe=parent.document.createElement("div");this.parentSafeProbe.id="ryder-parent-safe-probe";
        this.parentSafeProbe.style.cssText="position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
        parent.document.body.append(this.parentSafeProbe);
      }
    }catch{/* Cross-origin embedding uses the iframe's own insets. */}
    const joystick=(id:string,walking:boolean)=>{
      const el=this.doc.createElement("div");el.id=id;el.dataset.ryderGameplay="joystick";el.dataset.touchControl="true";if(!walking)el.className="driving-control";this.root!.append(el);
      return new FloatingJoystick(el,signal,()=>this.canUse(walking?"STORE":"WORLD")&&this.tutorialAllowsGameplay(),walking,(x,y)=>{if(walking){this.contribution.walkX=x;this.contribution.walkY=y;}else this.contribution.steer=x;this.apply();},this.capturedPointers,e=>{if(!walking)acknowledgeDrivingGesture(this.win,e);});
    };
    this.steer=joystick("okada-steer",false);this.walk=joystick("okada-walk",true);
    this.addAction("okada-btn-throttle","GAS",true,e=>{acknowledgeDrivingGesture(this.win,e);this.contribution.throttle=1;},()=>{this.contribution.throttle=0;});
    this.addAction("okada-btn-brake","BRAKE",true,e=>{acknowledgeDrivingGesture(this.win,e);this.startBrake();},()=>this.stopBrake());
    this.addAction("okada-btn-drift","DRIFT",true,()=>{this.contribution.drift=1;},()=>{this.contribution.drift=0;});
    this.addAction("okada-btn-interact","ACTION",false,()=>{this.contribution.interact=1;},()=>{this.contribution.interact=0;});
    this.buildHUD();this.buildOverlays();this.scanMenu();
    this.restoreNative=suppressNativeTouch(this.doc,signal);
    const reset=()=>this.reset("lifecycle");
    // A new physical gesture must never be mistaken for the prior gesture's
    // delayed compatibility click (notably on touch Safari).
    this.win?.addEventListener("pointerdown",()=>{this.compatibilityClick=null;},{capture:true,signal});
    this.win?.addEventListener("click",event=>{
      const pending=this.compatibilityClick;
      if(!pending||!event.isTrusted||event.detail===0)return;
      if(Date.now()>pending.until){this.compatibilityClick=null;return;}
      if(Math.hypot(event.clientX-pending.x,event.clientY-pending.y)<8){
        // A DOM-changing pointerup can retarget the browser's compatibility
        // click to a freshly opened dialog/backdrop rather than this button.
        this.compatibilityClick=null;event.preventDefault();event.stopImmediatePropagation();
      }
    },{capture:true,signal});
    const resize=()=>{reset();this.layout();this.refresh();};
    this.win?.addEventListener("blur",reset,{signal});
    this.win?.addEventListener("orientationchange",resize,{signal});
    this.win?.addEventListener("resize",resize,{signal});
    this.win?.visualViewport?.addEventListener("resize",resize,{signal});
    this.win?.visualViewport?.addEventListener("scroll",resize,{signal});
    this.win?.screen.orientation?.addEventListener("change",resize,{signal});
    this.doc.addEventListener("visibilitychange",()=>{if(this.doc.hidden)reset();},{signal});
    const Observer=this.win?.MutationObserver??MutationObserver;
    this.observer=new Observer(()=>{this.scanMenu();this.refresh();});
    this.observer.observe(this.doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    this.layout();this.refresh();
    // Only DOM/UI state and input identity are read here, never physics objects.
    const tick=()=>{if(!this.attached)return;this.refresh();this.frame=this.win?.requestAnimationFrame(tick)??null;};
    this.frame=this.win?.requestAnimationFrame(tick)??null;
  }

  private addAction(id:string,label:string,driving:boolean,down:(e:PointerEvent)=>void,up:()=>void):void {
    const el=this.doc.createElement("button");el.type="button";el.id=id;el.className="okada-btn"+(driving?" driving-control":"");el.dataset.ryderGameplay="action";el.dataset.touchControl="true";
    const span=this.doc.createElement("span");span.className="btn-label";span.textContent=label;el.append(span);this.root!.append(el);
    const button=new PointerButton(el,this.abort!.signal,()=>this.canUse(driving?"WORLD":undefined)&&this.tutorialAllowsGameplay(),e=>{down(e);this.apply();},()=>{up();this.apply();},this.capturedPointers);
    this.buttons.push(button);this.buttonOwners.set(id,button.owners);
  }
  private startBrake():void {
    const speed=readForwardSpeed(this.win);this.reversing=speed!==null&&speed<=BRAKE_REVERSE_ENTER_SPEED;this.writeBrake();
    this.brakeTimer=setInterval(()=>{
      if(!this.canUse("WORLD"))return;
      const v=readForwardSpeed(this.win);if(v===null)return;
      if(!this.reversing&&v<=BRAKE_REVERSE_ENTER_SPEED)this.reversing=true;
      else if(this.reversing&&v>=BRAKE_REENTER_SPEED)this.reversing=false;
      this.writeBrake();
    },BRAKE_REVERSE_POLL_MS);
  }
  private writeBrake():void {
    this.contribution.brake=this.reversing?0:1;this.contribution.reverse=this.reversing?1:0;
    const label=this.doc.querySelector("#okada-btn-brake .btn-label");if(label)label.textContent=this.reversing?"REV":"BRAKE";
    this.doc.getElementById("okada-btn-brake")?.classList.toggle("brake-rev",this.reversing);this.apply();
  }
  private stopBrake():void {
    if(this.brakeTimer!==null)clearInterval(this.brakeTimer);this.brakeTimer=null;this.reversing=false;
    this.contribution.brake=0;this.contribution.reverse=0;
    const label=this.doc.querySelector("#okada-btn-brake .btn-label");if(label?.textContent!=="BRAKE"&&label)label.textContent="BRAKE";
    this.doc.getElementById("okada-btn-brake")?.classList.remove("brake-rev");
  }
  reset(reason?:string):void {
    void reason;const captured=[...this.capturedPointers];this.stopBrake();this.steer?.reset();this.walk?.reset();this.buttons.forEach(b=>b.reset());
    this.hudResetters.forEach(reset=>reset());
    this.capturedPointers.clear();this.contribution={};this.manager.release("touch");
    for(const [pointer,element]of captured){try{if(element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);}catch{/* Detached element. */}}
  }
  private apply():void{this.manager.apply("touch",{...this.contribution});}
  private tutorialAllowsGameplay():boolean{return !this.doc.body.classList.contains("tutorial-locked")||this.game?.tutorial?.state==="teach_controls";}
  private canUse(expected?:"WORLD"|"STORE"):boolean{this.refresh();return this.attached&&isPlayable(this.state)&&(!expected||this.state===expected);}
  private portrait():boolean {
    const win=this.win;if(!win)return false;
    const type=win.screen.orientation?.type;
    if(type?.includes("landscape"))return false;
    if(type?.includes("portrait"))return true;
    let topPortrait=false;try{topPortrait=!!win.top&&win.top.innerHeight>win.top.innerWidth;}catch{/* Cross-origin embed. */}
    return win.innerHeight>win.innerWidth||topPortrait||win.matchMedia("(orientation: portrait)").matches;
  }
  refresh():void {
    if(!this.attached||!this.root)return;
    const body=this.doc.body,store=body.classList.contains("in-store-mode");
    if(store!==this.lastStoreClass){this.lastStoreClass=store;this.mode=store?"store":"driving";this.reset("canonical-mode");}
    const phone=!!this.game?.phone?.visible||!!this.doc.querySelector("#phone-hud.phone-visible");
    const menu=this.doc.getElementById("mp-main-menu");
    const menuVisible=(!!menu&&this.win!.getComputedStyle(menu).display!=="none")||!!this.doc.querySelector(".capy-confirm-overlay");
    const next=resolveMobileState({booted:!!this.game,inGame:body.classList.contains("in-game"),menu:menuVisible,portrait:this.portrait(),shop:!!this.shop?.classList.contains("visible"),phone,store:this.mode==="store",bound:this.bindingHealthy()});
    if(next!==this.state){this.reset("ui-state");this.state=next;this.layout();}
    if(this.root.dataset.state!==next)this.root.dataset.state=next;
    const tutorialReady=String(this.tutorialAllowsGameplay());if(this.root.dataset.tutorialReady!==tutorialReady)this.root.dataset.tutorialReady=tutorialReady;
    this.root.classList.toggle("not-in-game",next==="BOOT"||next==="MENU"||next==="DISCONNECTED");
    this.root.classList.toggle("phone-open",next==="PHONE");this.root.classList.toggle("is-portrait",next==="PORTRAIT_BLOCKED");this.root.classList.toggle("mode-store",next==="STORE");
    this.portraitBarrier?.classList.toggle("visible",next==="PORTRAIT_BLOCKED");
    if(this.phoneButton)this.phoneButton.hidden=next==="PHONE";
    if(this.closeButton){this.closeButton.hidden=next!=="PHONE";this.closeButton.classList.toggle("visible",next==="PHONE");}
  }

  private activate(el:HTMLElement,action:()=>void,keyboard=true):void {
    let owner:number|null=null;
    el.addEventListener("pointerdown",e=>{if(owner!==null)return;e.preventDefault();e.stopPropagation();owner=e.pointerId;this.capturedPointers.set(owner,el);try{el.setPointerCapture(owner);}catch{}},{signal:this.abort!.signal});
    el.addEventListener("pointerup",e=>{if(owner!==e.pointerId)return;owner=null;this.capturedPointers.delete(e.pointerId);e.preventDefault();e.stopPropagation();try{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);}catch{}this.compatibilityClick={x:e.clientX,y:e.clientY,until:Date.now()+700};action();this.refresh();},{signal:this.abort!.signal});
    const clear=()=>{if(owner!==null)this.capturedPointers.delete(owner);owner=null;};
    this.hudResetters.push(clear);
    for(const type of ["pointercancel","lostpointercapture"] as const)el.addEventListener(type,clear,{signal:this.abort!.signal});
    if(keyboard)el.addEventListener("click",e=>{e.stopPropagation();if(e.detail===0){action();this.refresh();}},{signal:this.abort!.signal});
    else el.addEventListener("click",e=>{
      // Pointerup already invoked the canonical click handler. Browsers may
      // still synthesize a compatibility click despite preventDefault on down.
      if(e.detail>0){e.preventDefault();e.stopImmediatePropagation();}
    },{capture:true,signal:this.abort!.signal});
  }
  private buildHUD():void {
    this.hud=this.doc.createElement("div");this.hud.id="ryder-top-hud";this.root!.append(this.hud);
    const make=(id:string,label:string,aria:string)=>{const b=this.doc.createElement("button");b.type="button";b.id=id;b.textContent=label;b.title=aria;b.setAttribute("aria-label",aria);b.dataset.touchControl="true";this.hud!.append(b);return b;};
    this.phoneButton=make("okada-btn-phone","☎","Phone");
    this.closeButton=make("ryder-phone-close","×","Close phone");this.closeButton.hidden=true;
    this.activate(this.phoneButton,()=>{
      if(!this.canUse())return;const phone=this.game?.phone;if(phone?._tabDisabled)return;
      phone?.revealRoot?.();phone?.show?.();acknowledgePhoneOpen(this.win);this.refresh();
    });
    this.activate(this.closeButton,()=>{const p=this.game?.phone;if(p?.minimize)p.minimize();else p?.hide?.();this.refresh();});
    for(const id of ["btn-menu","btn-mute"]){
      const button=this.doc.getElementById(id);if(!button)continue;
      const marker=this.doc.createComment(`Ryder HUD restore ${id}`);button.replaceWith(marker);this.hud.append(button);this.restoredHUD.push({button,marker});
      // Keep canonical click/audio/menu handlers on the actual nodes. Touch
      // activation is delivered inside the trusted pointerup gesture, once.
      this.activate(button,()=>button.click(),false);
    }
  }
  private buildOverlays():void {
    this.portraitBarrier=this.doc.createElement("div");this.portraitBarrier.id="okada-portrait-barrier";
    this.portraitBarrier.innerHTML='<div class="barrier-card"><div class="barrier-badge">RYDER</div><div class="barrier-device-wrap"><svg class="barrier-phone-svg" viewBox="0 0 64 96" width="64" height="96" fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="4" width="52" height="88" rx="10"/><path d="M48 30C58 40 58 56 48 66"/></svg></div><div class="barrier-title">Rotate your phone to play</div></div>';
    this.doc.body.append(this.portraitBarrier);
    this.shop=this.doc.createElement("div");this.shop.id="ryder-shop-modal";
    this.shop.innerHTML='<div class="ryder-shop-card"><div class="ryder-shop-badge">COMING SOON</div><div class="ryder-shop-title">RYDER SHOP</div><div class="ryder-shop-desc">Coming soon</div><button type="button" class="ryder-shop-close" id="ryder-shop-close">CLOSE</button></div>';
    this.doc.body.append(this.shop);
    this.activate(this.shop.querySelector("button")!,()=>{this.shop?.classList.remove("visible");this.refresh();});
  }
  private scanMenu():void {
    // Canonical Menu opens a confirmation dialog. Its click-only buttons must
    // be exempt from native canvas touch cancellation, just like Phone/apps.
    for(const overlay of Array.from(this.doc.querySelectorAll<HTMLElement>(".capy-confirm-overlay"))){
      if(overlay.hasAttribute("data-touch-control"))continue;
      overlay.dataset.touchControl="true";
      this.abort!.signal.addEventListener("abort",()=>overlay.removeAttribute("data-touch-control"),{once:true});
    }
    const badge=this.doc.getElementById("sylens-badge");if(badge&&badge.textContent!==RYDER_CREDIT)badge.textContent=RYDER_CREDIT;
    for(const button of Array.from(this.doc.querySelectorAll<HTMLElement>(".capy-mbtn"))){
      if(!/portal|vibe/i.test(button.textContent??"")||button.dataset.ryderShop)continue;
      const original=button.textContent,originalLabel=button.getAttribute("aria-label"),originalTouch=button.getAttribute("data-touch-control");button.textContent="SHOP";button.setAttribute("aria-label","SHOP");button.dataset.touchControl="true";button.dataset.ryderShop="true";button.classList.add("ryder-shop-repurposed");
      this.activate(button,()=>{this.shop?.classList.add("visible");this.refresh();},false);
      const open=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();this.shop?.classList.add("visible");this.refresh();};
      button.addEventListener("click",open,{capture:true,signal:this.abort!.signal});
      // Preserve the original text on disposal, including canonical menu reuse.
      this.abort!.signal.addEventListener("abort",()=>{button.textContent=original;if(originalLabel===null)button.removeAttribute("aria-label");else button.setAttribute("aria-label",originalLabel);if(originalTouch===null)button.removeAttribute("data-touch-control");else button.setAttribute("data-touch-control",originalTouch);delete button.dataset.ryderShop;button.classList.remove("ryder-shop-repurposed");},{once:true});
    }
  }
  private layout():void {
    if(!this.root||!this.viewportProbe||!this.hud)return;
    const win=this.win!,viewport=win.visualViewport,style=win.getComputedStyle(this.viewportProbe);
    const safe:Insets={top:parseFloat(style.paddingTop)||14,right:parseFloat(style.paddingRight)||20,bottom:parseFloat(style.paddingBottom)||18,left:parseFloat(style.paddingLeft)||20};
    // Some mobile browsers expose physical safe-area insets only in the outer
    // document. Convert those into iframe-local insets without double-padding
    // a frame that already starts below a header or inside a safe area.
    try{
      if(this.parentSafeProbe&&win.frameElement){
        const parent=win.parent,p=parent.getComputedStyle(this.parentSafeProbe),r=win.frameElement.getBoundingClientRect();
        const sx=r.width/win.innerWidth||1,sy=r.height/win.innerHeight||1;
        safe.left=Math.max(safe.left,((parseFloat(p.paddingLeft)||0)-r.left)/sx);
        safe.right=Math.max(safe.right,(r.right-parent.innerWidth+(parseFloat(p.paddingRight)||0))/sx);
        safe.top=Math.max(safe.top,((parseFloat(p.paddingTop)||0)-r.top)/sy);
        safe.bottom=Math.max(safe.bottom,(r.bottom-parent.innerHeight+(parseFloat(p.paddingBottom)||0))/sy);
      }
    }catch{/* Cross-origin parent or a frame being detached. */}
    const width=viewport?.width??win.innerWidth,height=viewport?.height??win.innerHeight,x=viewport?.offsetLeft??0,y=viewport?.offsetTop??0;
    const layout=resolveLayout(width,height,safe,this.mode==="store");
    for(const joystick of [this.steer,this.walk])if(joystick)place(joystick.element,layout.movement,x,y);
    for(const [id,rect]of [["okada-btn-throttle",layout.gas],["okada-btn-brake",layout.brakeReverse],["okada-btn-drift",layout.drift],["okada-btn-interact",layout.action]] as const){const el=this.doc.getElementById(id);if(el)place(el,rect,x,y);}
    place(this.hud,layout.hud,x,y);
  }
  detach():void {
    if(!this.attached)return;
    this.attached=false;if(this.frame!==null)this.win?.cancelAnimationFrame(this.frame);this.frame=null;
    this.compatibilityClick=null;
    this.reset("dispose");this.observer?.disconnect();this.observer=null;this.abort?.abort();this.abort=null;
    for(const {button,marker}of this.restoredHUD)marker.replaceWith(button);this.restoredHUD=[];
    this.restoreNative?.();this.restoreNative=null;
    this.root?.remove();this.root=null;this.hud=null;this.portraitBarrier?.remove();this.shop?.remove();this.viewportProbe?.remove();this.parentSafeProbe?.remove();this.parentSafeProbe=null;
    this.doc.getElementById("okada-phase1-controls-style")?.remove();this.buttons=[];this.hudResetters=[];this.buttonOwners.clear();this.steer=null;this.walk=null;this.state="BOOT";
  }
}
