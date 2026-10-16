import { SHELL_STYLES } from "./shell-styles";
import { CONTROL_LAYOUT } from "./layout";
import { STEER_MAX_THROW } from "./floating-joystick";
export const MOBILE_STYLES=`
:root{--okada-safe-top:max(env(safe-area-inset-top,0px),14px);--okada-safe-bottom:max(env(safe-area-inset-bottom,0px),18px);--okada-safe-left:max(env(safe-area-inset-left,0px),20px);--okada-safe-right:max(env(safe-area-inset-right,0px),20px)}
html[data-ryder-mobile] #mobile-controls,html[data-ryder-mobile] #mobile-joystick,html[data-ryder-mobile] [id^="btn-touch-"],html[data-ryder-mobile] #top-right-controls{display:none!important;pointer-events:none!important}
#okada-phase1-controls-root{position:fixed;inset:0;z-index:300;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font-family:system-ui,sans-serif}
#okada-phase1-controls-root:not([data-state="WORLD"]):not([data-state="STORE"]):not([data-state="PHONE"]){visibility:hidden}
#okada-phase1-controls-root [data-ryder-gameplay],#ryder-top-hud{position:fixed;touch-action:none;pointer-events:auto;box-sizing:border-box}
#okada-phase1-controls-root [data-ryder-gameplay]{visibility:hidden;pointer-events:none}
#okada-phase1-controls-root[data-state="WORLD"] .driving-control,#okada-phase1-controls-root[data-state="WORLD"] #okada-btn-interact,#okada-phase1-controls-root[data-state="STORE"] #okada-walk,#okada-phase1-controls-root[data-state="STORE"] #okada-btn-interact{visibility:visible;pointer-events:auto}
#okada-phase1-controls-root[data-tutorial-ready="false"] [data-ryder-gameplay]{visibility:hidden;pointer-events:none}
#okada-walk{display:none}#okada-phase1-controls-root[data-state="STORE"] #okada-walk{display:block}
#okada-phase1-controls-root[data-state="STORE"] .driving-control{display:none}
.okada-btn,#ryder-top-hud button{border:1px solid rgba(255,255,255,.28);background:rgba(17,26,36,.43);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:inset 0 1px rgba(255,255,255,.15),0 3px 12px #0003;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:inherit;font-weight:650;touch-action:none;-webkit-tap-highlight-color:transparent;cursor:pointer}
.okada-btn{border-radius:50%;font-size:12px;letter-spacing:.04em;transition:background 80ms,box-shadow 80ms}
.okada-btn.pressed{background:rgba(106,201,191,.5);box-shadow:inset 0 0 0 2px #d4fff8aa,0 0 18px #7fddd333}
#okada-btn-throttle{background:rgba(141,199,176,.30);border-color:#d0f4df88;font-size:14px}
#okada-steer,#okada-walk{background:transparent;touch-action:none}
.stick-ring,.knob{position:absolute;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%);opacity:0}
.stick-ring{width:${STEER_MAX_THROW*2}px;height:${STEER_MAX_THROW*2}px;border:1px solid #fff6;background:#12212d33}
.knob{width:38px;height:38px;border:1px solid #fff9;background:#ddf9f488;box-shadow:0 2px 10px #0003}
.active .stick-ring,.active .knob{opacity:.85}
#ryder-top-hud{display:flex;gap:${CONTROL_LAYOUT.hud.gap}px;z-index:310;pointer-events:none}
#ryder-top-hud button{position:static!important;min-width:${CONTROL_LAYOUT.hud.target}px!important;width:${CONTROL_LAYOUT.hud.target}px!important;height:${CONTROL_LAYOUT.hud.target}px!important;min-height:${CONTROL_LAYOUT.hud.target}px!important;border-radius:12px;pointer-events:auto;font-size:20px;flex:none}
#ryder-top-hud button svg{width:22px;height:22px;pointer-events:none}
#ryder-top-hud [hidden]{display:none!important}
#okada-phase1-controls-root:not([data-state="WORLD"]):not([data-state="STORE"]):not([data-state="PHONE"]) #ryder-top-hud{visibility:hidden;pointer-events:none}
#okada-phase1-controls-root:not([data-state="WORLD"]):not([data-state="STORE"]):not([data-state="PHONE"]) #ryder-top-hud button{visibility:hidden;pointer-events:none}
html[data-ryder-mobile] #mission-prompt,html[data-ryder-mobile] #mission-result{z-index:400!important}
${SHELL_STYLES}
`;
