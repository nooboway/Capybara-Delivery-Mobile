// Existing Phone, portrait, signature and Shop presentation; gameplay geometry lives in layout.ts.
export const SHELL_STYLES = `
      /* The closed native peek must not cover BRAKE/REVERSE. Phone has its own HUD entry. */
      #phone-hud:not(.phone-visible) { visibility: hidden !important; pointer-events: none !important; }
      @media (pointer: coarse) and (orientation: landscape) {
        #phone-hud.phone-visible {
          top: calc(var(--okada-safe-top) + 58px) !important;
          bottom: auto !important; right: var(--okada-safe-right) !important;
          transform: none !important; max-height: none !important;
        }
        #phone-hud.phone-visible .phone-shell { max-height: none !important; }
        #phone-hud .phone-frame { width: min(420px, 60vw); }
        #phone-hud .phone-screen {
          height: calc(100dvh - var(--embed-bar, 0px) - var(--okada-safe-top) - var(--okada-safe-bottom) - 110px);
        }
        #phone-hud .home-screen { padding-top: 24px; overflow-y: auto; }
        #phone-hud .app-icon { min-height: 64px; }
        #phone-hud .app-titlebar { flex-shrink: 0; padding: 5px 10px; }
        #phone-hud .app-footer { flex-shrink: 0; padding: 4px 10px; }
        #phone-hud .app-content { min-height: 0; padding: 4px 8px; overflow-y: auto !important; }
        /* Fit the offer to the available landscape screen. Keep actions in the
           card; only the item list scrolls if text or a short viewport needs it. */
        #phone-hud .app-content:has(.offer-screen:not([style*="display: none"]):not([style*="display:none"])) { overflow: hidden !important; }
        #phone-hud .offer-screen { flex: 1 1 auto; height: 100%; min-height: 0; padding: 0 4px; }
        #phone-hud .offer-hero { flex-shrink: 0; flex-direction: row; justify-content: space-between; padding: 2px 0; gap: 8px; }
        #phone-hud .offer-title-row { justify-content: flex-start; }
        #phone-hud .offer-reward-row { flex-direction: row; gap: 6px; }
        #phone-hud .offer-reward { font-size: 24px; }
        #phone-hud .offer-timer-bar { flex-shrink: 0; margin: 3px 0 2px; }
        #phone-hud .offer-timer-label { flex-shrink: 0; margin-bottom: 2px; }
        #phone-hud .offer-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-top: 2px; }
        #phone-hud .offer-items { padding: 2px 0; gap: 4px; }
        #phone-hud .offer-actions { flex-shrink: 0; margin-top: 2px; padding: 2px 0 4px; }
        #phone-hud .btn-offer-accept, #phone-hud .btn-offer-skip { min-height: 44px; padding: 8px 12px; }
      }

      /* Orientation Barrier Overlay */
      #okada-portrait-barrier {
        position: fixed; inset: 0; z-index: 10000;
        background: radial-gradient(circle at center, #1e293b 0%, #090d16 100%);
        color: #f8fafc;
        display: none; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; padding: 28px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #okada-portrait-barrier.visible {
        display: flex !important;
      }
      .barrier-card {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        max-width: 320px;
      }
      .barrier-badge {
        font-size: 13px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
        color: #38bdf8; background: rgba(56, 189, 248, 0.12);
        padding: 4px 14px; border-radius: 999px; margin-bottom: 24px;
        border: 1px solid rgba(56, 189, 248, 0.28);
      }
      .barrier-device-wrap {
        margin-bottom: 24px;
        display: flex; align-items: center; justify-content: center;
      }
      .barrier-phone-svg {
        animation: ryderPhoneRotate 2.6s infinite ease-in-out;
        transform-origin: center center;
        filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.4));
      }
      .barrier-title {
        font-size: 22px; font-weight: 800; margin-bottom: 10px; color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .barrier-subtitle {
        font-size: 14px; color: #94a3b8; line-height: 1.5; max-width: 280px;
      }
      @keyframes ryderPhoneRotate {
        0%, 15% { transform: rotate(0deg); }
        45%, 65% { transform: rotate(-90deg); }
        85%, 100% { transform: rotate(0deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .barrier-phone-svg {
          animation: none !important;
        }
      }

      /* Suppress obsolete Vibe Jam player-facing marks */
      img[src*="award_white_on_transparent_vibejam_winner"],
      img[alt*="Vibe Jam Winner"] { display: none !important; }

      /* Liquid-Glass Studio Signature: sylens studios ™ */
      #sylens-badge {
        position: fixed !important;
        bottom: calc(var(--okada-safe-bottom) + 8px) !important;
        right: calc(var(--okada-safe-right) + 8px) !important;
        padding: 6px 14px !important;
        border-radius: 999px !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(15, 23, 42, 0.5) !important;
        color: rgba(248, 250, 252, 0.9) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: 0.1em !important;
        text-transform: lowercase !important;
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.35) !important;
        backdrop-filter: blur(14px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(14px) saturate(160%) !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 10000 !important;
        transition: opacity 200ms ease !important;
      }
      body.in-game #sylens-badge,
      body.in-store-mode #sylens-badge { opacity: 0 !important; }

      /* Ryder Shop Shell */
      #ryder-shop-modal {
        position: fixed; inset: 0; z-index: 99995;
        background: rgba(10, 15, 26, 0.82);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        display: none; flex-direction: column; align-items: center; justify-content: center;
        color: #f8fafc; padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #ryder-shop-modal.visible { display: flex !important; }
      .ryder-shop-card {
        background: rgba(15, 23, 42, 0.75);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 32px 36px;
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        max-width: 380px; width: 90vw; text-align: center;
      }
      .ryder-shop-badge {
        font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;
        color: #fbbf24; background: rgba(245, 158, 11, 0.15);
        padding: 4px 12px; border-radius: 999px;
        border: 1px solid rgba(245, 158, 11, 0.35);
      }
      .ryder-shop-title { font-size: 26px; font-weight: 800; letter-spacing: 0.08em; color: #f8fafc; }
      .ryder-shop-desc { font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px; }
      .ryder-shop-close {
        padding: 12px 24px; border-radius: 12px; border: none;
        background: #38bdf8; color: #0b0f19;
        font-size: 15px; font-weight: 700; cursor: pointer;
        box-shadow: 0 4px 16px rgba(56, 189, 248, 0.4);
      }
`;
