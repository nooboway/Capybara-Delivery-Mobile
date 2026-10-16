export const STEER_DEADZONE=.04,STEER_MAX_THROW=60,STEER_RESPONSE_EXPONENT=1;
export const WALK_DEADZONE=.18,WALK_MAX_RADIUS=60;
/** One component implementation for WORLD X steering and STORE XY walking. */
export class FloatingJoystick {
  owner:number|null=null;
  private x=0;private y=0;
  private ring:HTMLDivElement;private puck:HTMLDivElement;
  constructor(readonly element:HTMLDivElement,signal:AbortSignal,allowed:()=>boolean,readonly walking:boolean,write:(x:number,y:number)=>void,captures:Map<number,Element>,gesture:(e:PointerEvent)=>void){
    this.ring=element.ownerDocument.createElement("div");this.ring.className="stick-ring";
    this.puck=element.ownerDocument.createElement("div");this.puck.className="knob";element.append(this.ring,this.puck);
    element.addEventListener("pointerdown",e=>{
      if(!allowed()||this.owner!==null)return;
      e.preventDefault();gesture(e);this.owner=e.pointerId;this.x=e.clientX;this.y=e.clientY;captures.set(e.pointerId,element);
      try{element.setPointerCapture(e.pointerId);}catch{/* Test-only synthetic pointer. */}
      const r=element.getBoundingClientRect();
      for(const part of [this.ring,this.puck]){part.style.left=`${this.x-r.left}px`;part.style.top=`${this.y-r.top}px`;}
      element.classList.add("active");write(0,0);
    },{signal});
    element.addEventListener("pointermove",e=>{
      if(e.pointerId!==this.owner||!allowed())return;
      const dx=e.clientX-this.x,dy=e.clientY-this.y,dist=Math.hypot(dx,dy),radius=walking?WALK_MAX_RADIUS:STEER_MAX_THROW;
      const k=dist>radius?radius/dist:1;
      this.puck.style.transform=`translate(calc(-50% + ${dx*k}px),calc(-50% + ${dy*k}px))`;
      if(walking){const mag=Math.min(1,dist/radius),scaled=mag<WALK_DEADZONE?0:(mag-WALK_DEADZONE)/(1-WALK_DEADZONE);write(dist?dx/dist*scaled:0,dist?-dy/dist*scaled:0);}
      else{const x=Math.max(-1,Math.min(1,dx/radius));write(Math.abs(x)<STEER_DEADZONE?0:x,0);}
    },{signal});
    const end=(e:PointerEvent)=>{
      if(e.pointerId!==this.owner)return;
      this.reset();captures.delete(e.pointerId);write(0,0);
      try{if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);}catch{/* Already released. */}
    };
    for(const type of ["pointerup","pointercancel","lostpointercapture"] as const)element.addEventListener(type,end,{signal});
  }
  reset():void {this.owner=null;this.element.classList.remove("active");this.puck.style.transform="";}
}
