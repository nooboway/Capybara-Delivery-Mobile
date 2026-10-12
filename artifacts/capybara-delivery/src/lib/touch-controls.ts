/**
 * Mobile Virtual Touch Controls Bridge for Capybara Delivery
 * Injects responsive, high-performance touch controls into the embedded game iframe.
 */

export interface TouchControlsOptions {
  enabled: boolean;
}

const TOUCH_STYLES_ID = 'capybara-virtual-controls-styles';
const TOUCH_OVERLAY_ID = 'capybara-virtual-controls-overlay';

export function installTouchControls(frame: HTMLIFrameElement, options: TouchControlsOptions) {
  const frameDoc = frame.contentDocument;
  const frameWin = frame.contentWindow;
  if (!frameDoc || !frameWin) return;

  // Toggle class on iframe html/body
  if (options.enabled) {
    frameDoc.documentElement.classList.add('touch-controls-enabled');
    frameDoc.body.classList.add('touch-controls-enabled');
  } else {
    frameDoc.documentElement.classList.remove('touch-controls-enabled');
    frameDoc.body.classList.remove('touch-controls-enabled');
    const existing = frameDoc.getElementById(TOUCH_STYLES_ID);
    if (existing) existing.remove();
    return;
  }

  // Ensure controls-ready class is added so the original game stylesheet allows controls
  frameDoc.body.classList.add('controls-ready');

  // Inject or update styles
  let styleEl = frameDoc.getElementById(TOUCH_STYLES_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = frameDoc.createElement('style');
    styleEl.id = TOUCH_STYLES_ID;
    frameDoc.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Force show mobile controls when touch controls are enabled */
    html.touch-controls-enabled #mobile-controls,
    body.touch-controls-enabled #mobile-controls {
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      pointer-events: none !important;
      z-index: 8000 !important;
    }

    /* Base Touch Button Styling */
    .touch-btn {
      pointer-events: auto !important;
      touch-action: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      position: fixed !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(15, 23, 42, 0.65) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 2.5px solid rgba(255, 255, 255, 0.45) !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-weight: 800 !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
      transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease !important;
    }

    .touch-btn:active,
    .touch-btn.pressed {
      transform: scale(0.90) !important;
      border-color: rgba(255, 255, 255, 0.9) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(0, 0, 0, 0.3) !important;
    }

    /* Steering cluster (Bottom Left) */
    #btn-touch-left {
      left: 20px !important;
      bottom: 36px !important;
      width: 76px !important;
      height: 76px !important;
      font-size: 32px !important;
      border-color: rgba(56, 189, 248, 0.6) !important;
      color: #38bdf8 !important;
    }
    #btn-touch-left:active, #btn-touch-left.pressed {
      background: rgba(56, 189, 248, 0.4) !important;
      color: #fff !important;
    }

    #btn-touch-right {
      left: 108px !important;
      bottom: 36px !important;
      width: 76px !important;
      height: 76px !important;
      font-size: 32px !important;
      border-color: rgba(56, 189, 248, 0.6) !important;
      color: #38bdf8 !important;
    }
    #btn-touch-right:active, #btn-touch-right.pressed {
      background: rgba(56, 189, 248, 0.4) !important;
      color: #fff !important;
    }

    /* Throttle / Reverse cluster (Bottom Right) */
    #btn-touch-accel {
      right: 24px !important;
      bottom: 36px !important;
      width: 92px !important;
      height: 92px !important;
      font-size: 38px !important;
      border-color: rgba(34, 197, 94, 0.7) !important;
      background: rgba(22, 101, 52, 0.75) !important;
      color: #4ade80 !important;
    }
    #btn-touch-accel:active, #btn-touch-accel.pressed {
      background: rgba(34, 197, 94, 0.6) !important;
      color: #ffffff !important;
    }

    #btn-touch-reverse {
      right: 128px !important;
      bottom: 36px !important;
      width: 74px !important;
      height: 74px !important;
      font-size: 30px !important;
      border-color: rgba(239, 68, 68, 0.65) !important;
      background: rgba(127, 29, 29, 0.7) !important;
      color: #f87171 !important;
    }
    #btn-touch-reverse:active, #btn-touch-reverse.pressed {
      background: rgba(239, 68, 68, 0.55) !important;
      color: #ffffff !important;
    }

    /* Drift / Handbrake (Above Accel) */
    #btn-touch-speed {
      right: 28px !important;
      bottom: 142px !important;
      width: 72px !important;
      height: 72px !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      letter-spacing: 0.5px !important;
      border-color: rgba(245, 158, 11, 0.7) !important;
      background: rgba(146, 64, 14, 0.7) !important;
      color: #fbbf24 !important;
    }
    #btn-touch-speed:active, #btn-touch-speed.pressed {
      background: rgba(245, 158, 11, 0.55) !important;
      color: #ffffff !important;
    }

    /* Action / Interact 'E' Button (Above Reverse) */
    #btn-touch-interact {
      right: 114px !important;
      bottom: 126px !important;
      width: 72px !important;
      height: 72px !important;
      font-size: 24px !important;
      font-weight: 900 !important;
      border-color: rgba(168, 85, 247, 0.7) !important;
      background: rgba(88, 28, 135, 0.75) !important;
      color: #c084fc !important;
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.45) !important;
    }
    #btn-touch-interact:active, #btn-touch-interact.pressed {
      background: rgba(168, 85, 247, 0.65) !important;
      color: #ffffff !important;
    }

    /* In-Store Mode Handling */
    body.touch-controls-enabled.in-store-mode #btn-touch-left,
    body.touch-controls-enabled.in-store-mode #btn-touch-right,
    body.touch-controls-enabled.in-store-mode #btn-touch-accel,
    body.touch-controls-enabled.in-store-mode #btn-touch-reverse,
    body.touch-controls-enabled.in-store-mode #btn-touch-speed {
      display: none !important;
    }

    body.touch-controls-enabled.in-store-mode #mobile-joystick {
      display: block !important;
      position: fixed !important;
      left: 36px !important;
      bottom: 44px !important;
      width: 140px !important;
      height: 140px !important;
      z-index: 8500 !important;
      touch-action: none !important;
      pointer-events: auto !important;
    }

    body.touch-controls-enabled.in-store-mode #btn-touch-interact {
      right: 44px !important;
      bottom: 56px !important;
      width: 90px !important;
      height: 90px !important;
      font-size: 32px !important;
    }

    /* Small Screen / Mobile Adjustments */
    @media (max-width: 600px) {
      #btn-touch-left { left: 12px !important; bottom: 24px !important; width: 66px !important; height: 66px !important; font-size: 26px !important; }
      #btn-touch-right { left: 88px !important; bottom: 24px !important; width: 66px !important; height: 66px !important; font-size: 26px !important; }
      #btn-touch-accel { right: 14px !important; bottom: 24px !important; width: 80px !important; height: 80px !important; font-size: 32px !important; }
      #btn-touch-reverse { right: 104px !important; bottom: 24px !important; width: 64px !important; height: 64px !important; font-size: 26px !important; }
      #btn-touch-speed { right: 18px !important; bottom: 116px !important; width: 60px !important; height: 60px !important; font-size: 11px !important; }
      #btn-touch-interact { right: 90px !important; bottom: 102px !important; width: 60px !important; height: 60px !important; font-size: 20px !important; }
    }
  `;

  // Bind high-reliability input bridge
  bindButtons(frameDoc, frameWin);
  bindStoreJoystick(frameDoc, frameWin);
}

const BUTTON_KEY_MAP: Record<string, string> = {
  'btn-touch-left': 'KeyA',
  'btn-touch-right': 'KeyD',
  'btn-touch-accel': 'KeyW',
  'btn-touch-reverse': 'KeyS',
  'btn-touch-speed': 'ShiftLeft',
  'btn-touch-interact': 'KeyE',
};

function bindButtons(doc: Document, win: Window) {
  for (const [btnId, keyCode] of Object.entries(BUTTON_KEY_MAP)) {
    const el = doc.getElementById(btnId);
    if (!el) continue;

    // Remove old listeners by cloning
    if ((el as any)._touchBridgeInstalled) continue;
    (el as any)._touchBridgeInstalled = true;

    const dispatch = (type: 'keydown' | 'keyup') => {
      try {
        win.dispatchEvent(
          new KeyboardEvent(type, {
            code: keyCode,
            key: keyCode.replace(/^Key/, '').toLowerCase(),
            bubbles: true,
            cancelable: true,
          }),
        );
      } catch {}
    };

    const press = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const audio = (win as any).__capyAudio;
        if (audio?.ctx?.state === 'suspended') {
          audio.ctx.resume();
        }
      } catch {}
      el.classList.add('pressed');
      dispatch('keydown');
      try {
        navigator.vibrate?.(12);
      } catch {}
    };

    const release = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('pressed');
      dispatch('keyup');
    };

    el.addEventListener('pointerdown', press, { passive: false });
    el.addEventListener('pointerup', release, { passive: false });
    el.addEventListener('pointercancel', release, { passive: false });
    el.addEventListener('pointerleave', release, { passive: false });
  }
}

function bindStoreJoystick(doc: Document, win: Window) {
  const joystick = doc.getElementById('mobile-joystick');
  if (!joystick || (joystick as any)._joystickBridgeInstalled) return;
  (joystick as any)._joystickBridgeInstalled = true;

  const thumb = joystick.querySelector('.joystick-thumb') as HTMLElement | null;

  let activePointerId: number | null = null;
  let centerX = 0;
  let centerY = 0;
  const maxRadius = 50;

  const currentHeldKeys = new Set<string>();

  const updateKeys = (dx: number, dy: number) => {
    const threshold = 0.25;
    const normX = dx / maxRadius;
    const normY = dy / maxRadius;

    const neededKeys = new Set<string>();
    if (normX < -threshold) neededKeys.add('KeyA');
    if (normX > threshold) neededKeys.add('KeyD');
    if (normY < -threshold) neededKeys.add('KeyW');
    if (normY > threshold) neededKeys.add('KeyS');

    // Release unneeded keys
    for (const key of currentHeldKeys) {
      if (!neededKeys.has(key)) {
        win.dispatchEvent(new KeyboardEvent('keyup', { code: key, bubbles: true }));
        currentHeldKeys.delete(key);
      }
    }

    // Press new keys
    for (const key of neededKeys) {
      if (!currentHeldKeys.has(key)) {
        win.dispatchEvent(new KeyboardEvent('keydown', { code: key, bubbles: true }));
        currentHeldKeys.add(key);
      }
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (activePointerId !== null) return;
    activePointerId = e.pointerId;
    joystick.setPointerCapture?.(e.pointerId);
    joystick.classList.add('active');

    const rect = joystick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;

    onPointerMove(e);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;

    let deltaX = e.clientX - centerX;
    let deltaY = e.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    if (thumb) {
      thumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    updateKeys(deltaX, deltaY);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    joystick.classList.remove('active');

    if (thumb) {
      thumb.style.transform = 'translate(0px, 0px)';
    }

    // Release all keys
    for (const key of currentHeldKeys) {
      win.dispatchEvent(new KeyboardEvent('keyup', { code: key, bubbles: true }));
    }
    currentHeldKeys.clear();
  };

  joystick.addEventListener('pointerdown', onPointerDown, { passive: false });
  joystick.addEventListener('pointermove', onPointerMove, { passive: false });
  joystick.addEventListener('pointerup', onPointerUp, { passive: false });
  joystick.addEventListener('pointercancel', onPointerUp, { passive: false });
}
