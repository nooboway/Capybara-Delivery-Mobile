export type MobileUIState = "BOOT" | "MENU" | "WORLD" | "STORE" | "PHONE" | "SHOP" | "PORTRAIT_BLOCKED" | "DISCONNECTED";
export type StateSignals = {booted:boolean;inGame:boolean;menu:boolean;portrait:boolean;shop:boolean;phone:boolean;store:boolean;bound:boolean};
export function resolveMobileState(s:StateSignals):MobileUIState {
  if(s.portrait)return "PORTRAIT_BLOCKED";
  if(s.shop)return "SHOP";
  if(!s.booted)return "BOOT";
  if(!s.inGame||s.menu)return "MENU";
  if(!s.bound)return "DISCONNECTED";
  if(s.phone)return "PHONE";
  return s.store?"STORE":"WORLD";
}
export const isPlayable=(state:MobileUIState)=>state==="WORLD"||state==="STORE";
