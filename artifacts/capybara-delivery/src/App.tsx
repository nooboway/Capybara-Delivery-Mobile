import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Gamepad2, Maximize, Minimize, Smartphone, X, Copy, Check } from 'lucide-react';
import { installTouchControls } from '@/lib/touch-controls';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function prepareGameFrame(frame: HTMLIFrameElement, touchEnabled: boolean) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument) return;

  const shellStyles = frameDocument.createElement('style');
  shellStyles.id = 'capybara-mobile-shell-overrides';
  shellStyles.textContent = `
    html.capy-embed,
    html.capy-embed body {
      width: 100% !important;
      height: 100% !important;
      min-height: 100% !important;
      overflow: hidden !important;
    }

    html.capy-embed body {
      margin-top: 0 !important;
      transform: none !important;
    }

    #embed-bar {
      display: none !important;
    }
  `;
  frameDocument.head.append(shellStyles);

  // Install virtual touch controls
  installTouchControls(frame, { enabled: touchEnabled });

  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 760px)').matches ||
    navigator.maxTouchPoints > 0;

  if (!isTouchDevice && !touchEnabled) return;

  const updateTouchCopy = () => {
    const walker = frameDocument.createTreeWalker(
      frameDocument.body,
      frameDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4,
    );
    let node = walker.nextNode();
    let changed = 0;

    while (node) {
      const text = node.textContent?.trim();
      if (text === 'Click to start') {
        node.textContent = 'Tap to start';
        changed += 1;
      } else if (text === 'Best on desktop. Use mouse and keyboard') {
        node.textContent = 'Touch controls are enabled.';
        changed += 1;
      }
      node = walker.nextNode();
    }
    return changed;
  };

  const changed = updateTouchCopy();
  const Observer = frameDocument.defaultView?.MutationObserver;
  if (changed >= 2 || !Observer) return;

  const observer = new Observer(() => {
    if (updateTouchCopy() >= 2) observer.disconnect();
  });
  observer.observe(frameDocument.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  window.setTimeout(() => observer.disconnect(), 10_000);
}

function Home() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(true);

  useEffect(() => {
    const syncFullscreen = () => {
      const shell = document.querySelector('.game-shell');
      setIsFullscreen(document.fullscreenElement === shell);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    if (frameRef.current) {
      installTouchControls(frameRef.current, { enabled: touchControlsEnabled });
    }
  }, [touchControlsEnabled]);

  const toggleFullscreen = async () => {
    const target = document.querySelector<HTMLElement>('.game-shell');
    if (!target) return;
    try {
      if (!document.fullscreenElement) await target.requestFullscreen?.();
      else await document.exitFullscreen?.();
      setIsFullscreen(Boolean(document.fullscreenElement));
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const mobileUrl = 'https://wicked-horses-brake.loca.lt';

  const copyUrl = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <main className="game-shell" data-testid="game-shell">
      <iframe
        ref={frameRef}
        className="game-frame"
        title="Okada - A Game About Animals Delivering Food"
        src={`${import.meta.env.BASE_URL}capybara-game/index.html`}
        allow="gamepad; autoplay"
        allowFullScreen
        onLoad={(event) => prepareGameFrame(event.currentTarget, touchControlsEnabled)}
        data-testid="game-frame"
      />
      <div className="game-toolbar">
        <button
          type="button"
          className="toolbar-button"
          onClick={() => setShowMobileModal((prev) => !prev)}
          aria-label="Play on Mobile device"
          data-testid="button-mobile-link"
        >
          <Smartphone aria-hidden="true" className="toolbar-icon" />
          <span>Mobile</span>
        </button>
        <button
          type="button"
          className={`toolbar-button ${touchControlsEnabled ? 'is-active' : ''}`}
          onClick={() => setTouchControlsEnabled((prev) => !prev)}
          aria-label={touchControlsEnabled ? 'Disable touch controls' : 'Enable touch controls'}
          data-testid="button-touch-toggle"
        >
          <Gamepad2 aria-hidden="true" className="toolbar-icon" />
          <span>{touchControlsEnabled ? 'Touch: ON' : 'Touch: OFF'}</span>
        </button>
        <button
          type="button"
          className="fullscreen-button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? (
            <Minimize aria-hidden="true" className="fullscreen-icon" />
          ) : (
            <Maximize aria-hidden="true" className="fullscreen-icon" />
          )}
          <span>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>

      {showMobileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowMobileModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1.5px solid #38bdf8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              color: '#f8fafc',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
                <Smartphone size={20} />
                <span>Play Okada on Mobile / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              Open this link on your phone, iPad, or any mobile browser to play with fluid touch controls:
            </p>

            <div
              style={{
                background: '#1e293b',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                gap: '8px',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontFamily: 'monospace', color: '#38bdf8' }}>
                {mobileUrl}
              </div>
              <button
                type="button"
                onClick={() => copyUrl(mobileUrl)}
                style={{
                  background: copied ? '#10b981' : '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
              <strong>Tunnel Password:</strong> <code style={{ color: '#38bdf8' }}>105.113.107.160</code> (if prompted once by the tunnel security page).
              <br />
              <strong>Local Wi-Fi:</strong> <code style={{ color: '#38bdf8' }}>http://192.168.1.175:3000</code>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
