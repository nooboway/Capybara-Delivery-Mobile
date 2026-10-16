/** Deliberate multi-owner semantics: a second finger cannot cancel the first.
 * All listeners are owned by the containing control system's AbortSignal.
 */
export class PointerButton {
  readonly owners=new Set<number>();
  constructor(readonly element:HTMLButtonElement,signal:AbortSignal,allowed:()=>boolean,press:(e:PointerEvent)=>void,release:()=>void,captures:Map<number,Element>){
    element.addEventListener("pointerdown",e=>{
      if(!allowed()||this.owners.has(e.pointerId))return;
      e.preventDefault();e.stopPropagation();this.owners.add(e.pointerId);captures.set(e.pointerId,element);
      try{element.setPointerCapture(e.pointerId);}catch{/* Synthetic test pointers cannot capture. */}
      if(this.owners.size===1){element.classList.add("pressed");press(e);}
    },{signal});
    const end=(e:PointerEvent)=>{
      if(!this.owners.delete(e.pointerId))return;
      captures.delete(e.pointerId);
      if(!this.owners.size){element.classList.remove("pressed");release();}
      try{if(element.hasPointerCapture(e.pointerId))element.releasePointerCapture(e.pointerId);}catch{/* Already released. */}
    };
    for(const type of ["pointerup","pointercancel","lostpointercapture"] as const)element.addEventListener(type,end,{signal});
  }
  reset():void {this.owners.clear();this.element.classList.remove("pressed");}
}
