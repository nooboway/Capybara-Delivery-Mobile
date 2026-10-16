export type Rect = { x: number; y: number; width: number; height: number };
export type Insets = { top: number; right: number; bottom: number; left: number };
type Anchor = { x: number; y: number; scale: number };
/** Normalized anchors within the right-hand cluster, independent of device pixels.
 * This is the only control-position configuration. Future customization can
 * persist a validated replacement without changing component input behavior.
 */
export const CONTROL_LAYOUT = {
  movementWidth: .46,
  movementTop: .30,
  gas: { x: .82, y: .84, scale: 1 },
  brakeReverse: { x: .20, y: .84, scale: .86 },
  drift: { x: .47, y: .45, scale: .72 },
  action: { x: .83, y: .10, scale: .65 },
  storeAction: { x: .82, y: .84, scale: .85 },
  hud: { target: 44, gap: 8 },
} satisfies Record<string, Anchor | number | { target: number; gap: number }>;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export function resolveLayout(width: number, height: number, safe: Insets, store=false) {
  const usable = { x: safe.left, y: safe.top, width: width-safe.left-safe.right, height: height-safe.top-safe.bottom };
  const gasSize = clamp(height*.21,78,104);
  const clusterW = clamp(usable.width*.37,230,300);
  const clusterH = clamp((usable.height-60)*.86,220,310);
  const left = usable.x+usable.width-clusterW, top=usable.y+usable.height-clusterH;
  const button = (a: Anchor): Rect => {
    const size=Math.max(50,gasSize*a.scale);
    return {x:clamp(left+clusterW*a.x-size/2,usable.x,usable.x+usable.width-size),y:clamp(top+clusterH*a.y-size/2,usable.y+60,usable.y+usable.height-size),width:size,height:size};
  };
  return {
    movement: {x:usable.x,y:usable.y+usable.height*CONTROL_LAYOUT.movementTop,width:usable.width*CONTROL_LAYOUT.movementWidth,height:usable.height*(1-CONTROL_LAYOUT.movementTop)},
    gas:button(CONTROL_LAYOUT.gas),brakeReverse:button(CONTROL_LAYOUT.brakeReverse),drift:button(CONTROL_LAYOUT.drift),action:button(store?CONTROL_LAYOUT.storeAction:CONTROL_LAYOUT.action),
    hud:{x:store?usable.x:usable.x+usable.width-(CONTROL_LAYOUT.hud.target*3+CONTROL_LAYOUT.hud.gap*2),y:usable.y,width:CONTROL_LAYOUT.hud.target*3+CONTROL_LAYOUT.hud.gap*2,height:CONTROL_LAYOUT.hud.target},
  };
}
export function place(el: HTMLElement, rect: Rect, offsetX=0, offsetY=0): void {
  Object.assign(el.style,{left:`${rect.x+offsetX}px`,top:`${rect.y+offsetY}px`,width:`${rect.width}px`,height:`${rect.height}px`});
}
