import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Maximize, Minimize } from 'lucide-react';
import { initOkadaInput, type OkadaInputHandle } from '@/lib/input';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

// Single input handle for the embedded game; disposed when the shell unmounts.
let inputHandle: OkadaInputHandle | null = null;

function prepareGameFrame(frame: HTMLIFrameElement) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument || !frame.contentWindow) return;

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

  // Initialize the normalized input system (replaces the synthetic-keyboard bridge).
  if (!inputHandle) {
    void initOkadaInput(frame.contentWindow, frameDocument).then((handle) => {
      inputHandle = handle;
    });
  }

  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 760px)').matches ||
    navigator.maxTouchPoints > 0;

  if (!isTouchDevice) return;

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

  useEffect(() => {
    const syncFullscreen = () => {
      const shell = document.querySelector('.game-shell');
      setIsFullscreen(document.fullscreenElement === shell);
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    return () => {
      inputHandle?.dispose();
      inputHandle = null;
    };
  }, []);

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

  return (
    <main className="game-shell" data-testid="game-shell">
      <iframe
        ref={frameRef}
        className="game-frame"
        title="Okada - A Game About Animals Delivering Food"
        src={`${import.meta.env.BASE_URL}capybara-game/index.html`}
        allow="gamepad; autoplay"
        allowFullScreen
        onLoad={(event) => prepareGameFrame(event.currentTarget)}
        data-testid="game-frame"
      />
      <div className="game-toolbar">
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
