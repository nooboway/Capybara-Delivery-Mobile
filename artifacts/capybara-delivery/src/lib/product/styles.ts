export const PRODUCT_STYLES = `
html[data-ryder-product] .capy-support,
html[data-ryder-product] .capy-socials,
html[data-ryder-product] #mp-menu-credits,
html[data-ryder-product] #sponsor-title,
html[data-ryder-product] #sponsor-prompt,
html[data-ryder-product] .app-icon[data-sponsor],
html[data-ryder-product] [data-ryder-promotion],
html[data-ryder-product] [data-ryder-dismissed] { display:none!important;pointer-events:none!important }
html[data-ryder-product] #sylens-badge {text-transform:none!important;letter-spacing:.02em!important;font-size:11px!important;max-width:calc(100vw - 40px);box-sizing:border-box}
html[data-ryder-product] [data-ryder-loading-mark] > div {display:none!important}
html[data-ryder-product] #store-prompt .store-prompt-key {width:auto!important;min-width:26px;padding:0 6px;white-space:nowrap}
.ryder-dismiss-tip {position:absolute;right:4px;top:4px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;min-width:44px;min-height:44px;border:1px solid #ffffff35;border-radius:12px;background:#101820dd;color:#fff;font:24px system-ui;text-shadow:none;pointer-events:auto!important;touch-action:manipulation;cursor:pointer;z-index:2}
html[data-ryder-product] #tips-box[style*="opacity: 0;"] .ryder-dismiss-tip,
html[data-ryder-product] #subtitle[style*="opacity: 0;"] .ryder-dismiss-tip,
html[data-ryder-product] .capy-controls-panel[style*="opacity: 0;"] .ryder-dismiss-tip {visibility:hidden!important;pointer-events:none!important}
html[data-ryder-product] .ryder-dismissible {padding-right:54px!important;box-sizing:border-box;max-width:calc(100vw - 40px)!important}
html[data-ryder-product] #subtitle.ryder-dismissible {min-height:52px;font-size:clamp(16px,3.6vh,26px)!important;bottom:18%!important}
html[data-ryder-product] .capy-controls-panel.ryder-dismissible {max-height:50dvh;overflow:auto;min-width:0;padding:12px 54px 12px 12px;font-size:12px}
html[data-ryder-product] .capy-controls-panel .capy-ctrl-row {padding:4px 6px;font-size:12px}
html[data-ryder-phone-open] #subtitle,
html[data-ryder-phone-open] #tips-box,
html[data-ryder-phone-open] .capy-controls-panel {visibility:hidden!important;pointer-events:none!important}
html[data-ryder-phone-open] .ryder-dismiss-tip {visibility:hidden!important;pointer-events:none!important}
html[data-ryder-product] #phone-hud .app-content {overscroll-behavior:contain;touch-action:pan-y}
html[data-ryder-product] #phone-hud .offer-actions {flex-shrink:0;position:sticky;bottom:0;background:var(--ifood-bg-soft,#fff);z-index:2}
html[data-ryder-product] #phone-hud .btn-offer-accept,
html[data-ryder-product] #phone-hud .btn-offer-skip {min-height:44px!important}
@media (orientation:landscape) {
  html[data-ryder-product] #mp-main-menu {padding:var(--okada-safe-top,14px) var(--okada-safe-right,20px) var(--okada-safe-bottom,18px) var(--okada-safe-left,20px)!important;justify-content:center!important;box-sizing:border-box;overflow:hidden!important}
  html[data-ryder-product] #mp-menu-panel {display:grid!important;grid-template-columns:minmax(120px,.8fr) minmax(260px,1.3fr);grid-template-rows:minmax(0,1fr);align-items:center;gap:20px!important;width:min(900px,100%)!important;height:calc(100dvh - var(--okada-safe-top,14px) - var(--okada-safe-bottom,18px) - 32px);max-height:100%;transform:none!important;transform-origin:center!important}
  html[data-ryder-product] #mp-menu-panel > img {grid-column:1;grid-row:1;width:100%!important;max-width:300px!important;max-height:65dvh;object-fit:contain;animation:none!important;margin:0!important}
  html[data-ryder-product] #mp-menu-panel > [data-ryder-menu-view] {grid-column:2;grid-row:1;width:100%!important;max-width:100%!important;max-height:100%;min-height:0;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;gap:8px!important;padding:4px 2px!important;scroll-padding-bottom:58px}
  html[data-ryder-product] #mp-main-menu button:not(.menu-toggle):not([data-color]) {min-height:44px!important;padding:6px 10px!important;font-size:18px!important;box-sizing:border-box}
  html[data-ryder-product] #mp-main-menu [data-color] {min-width:32px;min-height:32px}
  html[data-ryder-product] #mp-main-menu [data-style] {min-width:70px;flex:1}
  html[data-ryder-product] .ryder-play-footer {position:sticky!important;bottom:0!important;display:flex!important;gap:12px!important;align-items:center;justify-content:center;flex-shrink:0;background:rgba(13,19,28,.96);padding:6px!important;z-index:5;width:100%!important;box-sizing:border-box;border-radius:14px}
  html[data-ryder-product] .ryder-play-footer button {flex:1;min-height:44px!important}
  html[data-ryder-product] #phone-hud.phone-visible {
    position:fixed!important;left:50%!important;right:auto!important;top:calc(var(--okada-safe-top,14px) + 56px)!important;bottom:auto!important;
    width:min(82vw,680px,calc(100vw - var(--okada-safe-left,20px) - var(--okada-safe-right,20px)))!important;
    height:min(82dvh,calc(100dvh - var(--okada-safe-top,14px) - var(--okada-safe-bottom,18px) - 64px))!important;
    max-height:none!important;transform:translateX(-50%)!important;transform-origin:center!important;transition:opacity .16s ease!important;z-index:280;box-sizing:border-box
  }
  html[data-ryder-product] #phone-hud.phone-visible .phone-shell,
  html[data-ryder-product] #phone-hud.phone-visible .phone-shell-shake {position:relative!important;inset:auto!important;transform:none!important;width:100%!important;height:100%!important;max-height:none!important;pointer-events:auto}
  html[data-ryder-product] #phone-hud.phone-visible .phone-frame {display:flex!important;flex-direction:column;width:100%!important;height:100%!important;max-height:100%!important;box-sizing:border-box}
  html[data-ryder-product] #phone-hud.phone-visible .phone-screen {height:auto!important;min-height:0!important;flex:1 1 auto;max-height:100%;width:100%;box-sizing:border-box}
  html[data-ryder-product] #phone-hud .home-screen {padding:16px 20px 8px!important;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box}
  html[data-ryder-product] #phone-hud .app-grid {grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 10px}
  html[data-ryder-product] #phone-hud .app-icon {min-height:64px}
  html[data-ryder-product] #phone-hud .app-icon-name {font-size:11px}
  html[data-ryder-product] #phone-hud .app-content {min-height:0!important;padding:4px 12px!important;overflow-y:auto!important}
  html[data-ryder-product] #phone-hud .offer-screen {height:100%;min-height:0;padding:0 4px;display:flex;flex-direction:column;box-sizing:border-box}
  html[data-ryder-product] #phone-hud .app-content:has(.offer-screen:not([style*="display: none"]):not([style*="display:none"])) {overflow:hidden!important}
  html[data-ryder-product] #phone-hud .offer-hero {flex-shrink:0;flex-direction:row;justify-content:space-between;padding:2px 0;gap:8px}
  html[data-ryder-product] #phone-hud .offer-reward-row {flex-direction:row;gap:6px}
  html[data-ryder-product] #phone-hud .offer-reward {font-size:24px}
  html[data-ryder-product] #phone-hud .offer-timer-bar {flex-shrink:0;margin:3px 0 2px}
  html[data-ryder-product] #phone-hud .offer-timer-label {flex-shrink:0;margin-bottom:2px}
  html[data-ryder-product] #phone-hud .offer-body {flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain}
  html[data-ryder-product] #phone-hud .offer-actions {margin-top:2px;padding:4px 0;display:flex;gap:12px}
  html[data-ryder-product] #phone-hud .app-titlebar,
  html[data-ryder-product] #phone-hud .app-footer {flex-shrink:0;padding:4px 12px}
  html[data-ryder-product] #phone-hud .phone-side-btn {display:none}
}
`;
