import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { initOkadaInput, type OkadaInputHandle } from '@/lib/input';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

// Input handle + abort controller bound to the current iframe generation.
let inputHandle: OkadaInputHandle | null = null;
let inputAbort: AbortController | null = null;

function prepareGameFrame(frame: HTMLIFrameElement) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument || !frame.contentWindow) return;

  // Dispose the previous generation (iframe reload) before initializing the new one.
  inputAbort?.abort();
  inputHandle?.dispose();
  inputHandle = null;
  inputAbort = new AbortController();
  const signal = inputAbort.signal;

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
  void initOkadaInput(frame.contentWindow, frameDocument, { signal }).then((handle) => {
    if (signal.aborted) {
      handle?.dispose();
      return;
    }
    inputHandle = handle;
  });

  // Adaptive HD render quality: bound DPR between 1.0 and 2.0 to restore crisp HD graphics on mobile screens without GPU buffer waste
  const frameWin = frame.contentWindow;
  const applyAdaptiveHdDpr = () => {
    const win = frameWin as unknown as {
      devicePixelRatio?: number;
      __capyGame?: {
        renderer?: { setPixelRatio: (dpr: number) => void };
        _applyRenderSize?: () => void;
      };
    };
    if (win?.__capyGame?.renderer) {
      const nativeDpr = win.devicePixelRatio || 1;
      const effectiveDpr = Math.min(Math.max(nativeDpr, 1.0), 2.0);
      win.__capyGame.renderer.setPixelRatio(effectiveDpr);
      win.__capyGame._applyRenderSize?.();
    }
  };
  applyAdaptiveHdDpr();
  const dprPoll = frameWin.setInterval(applyAdaptiveHdDpr, 200);
  frameWin.setTimeout(() => frameWin.clearInterval(dprPoll), 6000);
  frameWin.addEventListener('resize', applyAdaptiveHdDpr);

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
        node.textContent = 'Tap to ride';
        changed += 1;
      } else if (text === 'Best on desktop. Use mouse and keyboard') {
        node.textContent = 'Ryder touch controls enabled.';
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

  useEffect(() => {
    return () => {
      inputAbort?.abort();
      inputHandle?.dispose();
      inputHandle = null;
      inputAbort = null;
    };
  }, []);

  return (
    <main className="game-shell" data-testid="game-shell">
      <iframe
        ref={frameRef}
        className="game-frame"
        title="Ryder - A Game About Animals Delivering Food"
        src={`${import.meta.env.BASE_URL}capybara-game/index.html`}
        allow="gamepad; autoplay"
        allowFullScreen
        onLoad={(event) => prepareGameFrame(event.currentTarget)}
        data-testid="game-frame"
      />
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
