const NATIVE="#mobile-controls,#mobile-joystick,[id^='btn-touch-']";
/** Scoped and reversible ownership; never deletes native code or keyboard handlers. */
export function suppressNativeTouch(doc:Document,signal:AbortSignal):()=>void {
  const previous=doc.documentElement.getAttribute("data-ryder-mobile");
  doc.documentElement.setAttribute("data-ryder-mobile","owned");
  const guard=(event:TouchEvent)=>{
    const target=event.target as Element|null;
    if(!target?.closest?.(NATIVE+",[data-ryder-gameplay],canvas"))return;
    // Ryder consumes PointerEvents. Native touch listeners never acquire the
    // same gesture; Phone/apps and canonical menu/audio are deliberately exempt.
    event.stopImmediatePropagation();if(event.cancelable)event.preventDefault();
  };
  for(const type of ["touchstart","touchmove","touchend","touchcancel"] as const)doc.defaultView?.addEventListener(type,guard,{capture:true,passive:false,signal});
  return()=>{if(previous===null)doc.documentElement.removeAttribute("data-ryder-mobile");else doc.documentElement.setAttribute("data-ryder-mobile",previous);};
}
