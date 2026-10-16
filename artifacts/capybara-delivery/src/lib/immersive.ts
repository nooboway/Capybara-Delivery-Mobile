/**
 * Ryder immersive shell — fullscreen + landscape + PWA/standalone handling.
 *
 * Runs in the parent (React shell) realm against the game iframe document. The
 * player's explicit start gesture (tap-to-ride / Play) is the only trigger for
 * fullscreen. Capability-based and progressive: unsupported paths degrade to
 * landscape browser play with a one-time Add-to-Home-Screen hint.
 */
const A2HS_KEY = "ryder.a2hs.dismissed";

export interface ImmersiveHandle {
  dispose(): void;
}

function isStandalone(): boolean {
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    if (window.matchMedia?.("(display-mode: fullscreen)").matches) return true;
    return (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function fullscreenSupported(doc: Document): boolean {
  return !!(doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === "function");
}

async function enterFullscreen(doc: Document): Promise<boolean> {
  try {
    if (doc.fullscreenElement) return true;
    await doc.documentElement.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
    return true;
  } catch {
    return false;
  }
}

async function lockLandscape(win: Window): Promise<void> {
  try {
    const orientation = win.screen?.orientation as
      | (ScreenOrientation & { lock?: (orientation: string) => Promise<void> })
      | undefined;
    await orientation?.lock?.("landscape");
  } catch {
    // Unsupported or rejected: nonfatal; the portrait gate handles the rest.
  }
}

const HINT_STYLE_ID = "ryder-immersive-style";
function injectHintStyles(doc: Document): void {
  if (doc.getElementById(HINT_STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = HINT_STYLE_ID;
  style.textContent = `
    #ryder-a2hs-hint {
      position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
      transform: translateX(-50%); z-index: 2147483000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .ryder-a2hs-card {
      display: flex; flex-direction: column; gap: 8px; align-items: center;
      max-width: 320px; padding: 14px 18px; border-radius: 16px;
      background: rgba(15, 23, 42, 0.92); color: #f8fafc;
      border: 1px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .ryder-a2hs-title { font-size: 14px; font-weight: 800; letter-spacing: 0.02em; }
    .ryder-a2hs-body { font-size: 12.5px; color: #cbd5e1; text-align: center; line-height: 1.45; }
    .ryder-a2hs-dismiss {
      margin-top: 2px; padding: 8px 20px; border: none; border-radius: 10px;
      background: #38bdf8; color: #0b0f19; font-weight: 700; font-size: 13px; cursor: pointer;
    }
  `;
  doc.head.appendChild(style);
}

export function installImmersiveShell(frameWin: Window, frameDoc: Document): ImmersiveHandle {
  const isStartTarget = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    if (el.closest?.('[data-role="click"]')) return true;
    const button = el.closest?.("button");
    if (button && /^play\b/i.test((button.textContent || "").trim())) return true;
    return false;
  };

  const requestImmersive = async () => {
    await enterFullscreen(frameDoc);
    await lockLandscape(frameWin);
  };

  const onStartGesture = (e: Event) => {
    if (!isStartTarget(e.target)) return;
    // The parent-page iOS hint must never cover the game's lower touch targets.
    // Keep the hint on the menu, then remove it when the player chooses Play.
    if ((e.target as HTMLElement | null)?.closest?.("button")) {
      hint?.remove();
      hint = null;
    }
    void requestImmersive();
  };

  const onFullscreenChange = () => {
    try {
      frameWin.dispatchEvent(new Event("resize"));
    } catch {
      // ignore
    }
    (frameWin as unknown as { __okadaInput?: { manager?: { reset?: (reason?: string) => void } } })
      .__okadaInput?.manager?.reset?.("fullscreen-change");
  };

  frameDoc.addEventListener("pointerdown", onStartGesture, true);
  frameDoc.addEventListener("click", onStartGesture, true);
  frameDoc.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("fullscreenchange", onFullscreenChange);

  // iOS/Safari (or any browser without web fullscreen): one-time hint.
  let hint: HTMLElement | null = null;
  if (!fullscreenSupported(frameDoc) && !isStandalone()) {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(A2HS_KEY) === "1";
    } catch {
      // privacy mode
    }
    if (!dismissed) {
      injectHintStyles(document);
      hint = document.createElement("div");
      hint.id = "ryder-a2hs-hint";
      hint.innerHTML = `
        <div class="ryder-a2hs-card">
          <div class="ryder-a2hs-title">Add Ryder to Home Screen</div>
          <div class="ryder-a2hs-body">For the best full-screen experience, open Share and choose "Add to Home Screen".</div>
          <button type="button" class="ryder-a2hs-dismiss">Got it</button>
        </div>`;
      hint.querySelector(".ryder-a2hs-dismiss")?.addEventListener("click", () => {
        try {
          localStorage.setItem(A2HS_KEY, "1");
        } catch {
          // ignore
        }
        hint?.remove();
        hint = null;
      });
      document.body.appendChild(hint);
    }
  }

  return {
    dispose() {
      frameDoc.removeEventListener("pointerdown", onStartGesture, true);
      frameDoc.removeEventListener("click", onStartGesture, true);
      frameDoc.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      hint?.remove();
      hint = null;
    },
  };
}
