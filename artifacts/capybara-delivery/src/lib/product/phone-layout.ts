/** Canonical Maps caches its canvas size. Resize only its existing UI surface,
 * on an independent timer, never in a native observer/render/physics callback. */
export function installPhoneLayout(win: Window, doc: Document): () => void {
  const timer = win.setInterval(() => {
    const canvas = doc.querySelector<HTMLCanvasElement>("#phone-hud.phone-visible .maps-canvas");
    if (!canvas || !canvas.clientWidth || !canvas.clientHeight) return;
    const game = (win as Window & { __capyGame?: { phone?: { currentApp?: string; _mapsApp?: { _w?: number; _h?: number; _resize(): void } } } }).__capyGame;
    const maps = game?.phone?._mapsApp;
    if (game?.phone?.currentApp === "capymaps" && maps && (maps._w !== canvas.clientWidth || maps._h !== canvas.clientHeight)) maps._resize();
  }, 200);
  return () => win.clearInterval(timer);
}
