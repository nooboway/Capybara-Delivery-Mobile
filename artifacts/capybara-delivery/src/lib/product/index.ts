import { installPhoneLayout } from "./phone-layout";
import { RYDER_CREDIT, actionCopy } from "./copy";
import { PRODUCT_STYLES } from "./styles";

export interface ProductShell { dispose(): void }
/** Presentation/navigation adapter only. Never reads or writes game/physics state. */
export function installProductShell(win: Window, doc: Document, onStats: () => void): ProductShell {
  const abort = new AbortController();
  const dismissed = new Set<string>();
  const owned = new Set<Element>();
  const signatures = new WeakMap<HTMLElement, string>();
  const originals = new Map<Element, Map<string, string | null>>();
  const restores: Array<() => void> = [];
  const created = new Set<Element>();
  let disposed = false;
  const disposePhoneLayout = installPhoneLayout(win, doc);
  const attr = (el: Element, name: string, value: string | null) => {
    if (el.getAttribute(name) === value) return;
    let map = originals.get(el); if (!map) originals.set(el, map = new Map());
    if (!map.has(name)) map.set(name, el.getAttribute(name));
    if (value === null) el.removeAttribute(name); else el.setAttribute(name, value);
  };
  attr(doc.documentElement, "data-ryder-product", "");
  const style = doc.createElement("style"); style.id = "ryder-product-styles"; style.textContent = PRODUCT_STYLES; doc.head.append(style);
  const open = win.open;
  const local = (href: string) => {
    try { const u = new URL(href, win.location.href); return u.origin === win.location.origin && !u.pathname.startsWith("/sponsor"); }
    catch { return false; }
  };
  // Optional promotional handlers can bypass anchor clicks (e.g. native E).
  // Block external navigation, not technical fetch/media/WebSocket resources.
  const guardedOpen: Window["open"] = (url, target, features) => {
    if (!url || !local(String(url))) return null;
    return open.call(win, url, target, features);
  };
  win.open = guardedOpen;
  doc.addEventListener("click", event => {
    const target = event.target as Element | null;
    if (target?.closest("[data-ryder-stats]")) {
      event.preventDefault(); event.stopImmediatePropagation(); onStats(); return;
    }
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (link && !local(link.href)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { capture: true, signal: abort.signal });

  function markMenu() {
    const panel = doc.getElementById("mp-menu-panel");
    if (!panel) return;
    for (const el of Array.from(panel.children)) {
      if (el.tagName === "DIV") attr(el, "data-ryder-menu-view", "");
    }
    for (const button of Array.from(panel.querySelectorAll<HTMLButtonElement>("button.capy-mbtn"))) {
      if (/^(?:▸\s*)?(?:stats|estat[ií]sticas|statistiken|统计|통계|आँकड़े)$/iu.test(button.textContent?.trim() ?? "")) {
        attr(button, "data-ryder-stats", ""); attr(button, "data-touch-control", "true");
        attr(button, "aria-label", "Ryder Stats");
      }
    }
    // Reparent original nodes only: native selection/garage preview handlers survive.
    for (const view of Array.from(panel.querySelectorAll<HTMLElement>("[data-ryder-menu-view]"))) {
      const types = view.querySelector<HTMLElement>("[data-style]")?.parentElement;
      if (!types || view.hasAttribute("data-ryder-cosmetics")) continue;
      const buttons = Array.from(view.querySelectorAll<HTMLButtonElement>("button"));
      const play = buttons.find(b => /^(Play|Jogar|Jugar|Spielen|开始|플레이|खेलें)$/iu.test(b.textContent?.trim() ?? ""));
      const back = buttons.find(b => /^(Back|Voltar|Atrás|Zurück|返回|뒤로|वापस)$/iu.test(b.textContent?.trim() ?? ""));
      if (!play || !back) continue;
      attr(view, "data-ryder-cosmetics", "");
      const header = doc.createElement("div"), middle = doc.createElement("div"), footer = doc.createElement("div");
      header.className = "ryder-cosmetic-header"; middle.className = "ryder-cosmetic-middle"; footer.className = "ryder-play-footer";
      const move = (node: Node, into: HTMLElement) => {
        const marker = doc.createComment("Ryder layout restore"); node.parentNode!.insertBefore(marker, node); into.append(node);
        restores.push(() => marker.replaceWith(node));
      };
      // Keep the entire color group: canonical selection owns its inline visibility.
      const colors = view.querySelector<HTMLElement>("[data-color]")?.parentElement?.parentElement;
      const children = Array.from(view.childNodes);
      if (!view.querySelector("input") && view.firstElementChild && view.firstElementChild !== colors && !view.firstElementChild.querySelector("button,input")) attr(view.firstElementChild, "data-ryder-cosmetic-title", "");
      move(back, header); move(play, footer);
      for (const node of children) if (node.parentNode === view && node.nodeType !== 8) move(node, middle);
      if (types.parentElement) move(types, middle);
      if (colors?.parentElement) { move(colors, middle); attr(colors, "data-ryder-colors", ""); }
      attr(types, "data-ryder-types", "");
      view.append(header, middle, footer); created.add(header); created.add(middle); created.add(footer);
    }
  }

  function dismissible(el: HTMLElement, key: string) {
    const title = el.querySelector('[data-role="title"]')?.textContent ?? "";
    const body = el.querySelector('[data-role="body"]')?.textContent;
    const text = body ?? Array.from(el.childNodes).filter(n => !(n.nodeType === 1 && (n as Element).classList.contains("ryder-dismiss-tip"))).map(n => n.textContent).join("");
    if (!text.trim()) return;
    const signature = key === "controls" ? key : key + ":" + title + ":" + text.trim();
    signatures.set(el, signature);
    attr(el, "data-ryder-dismissed", dismissed.has(signature) ? "true" : null);
    el.inert = dismissed.has(signature);
    attr(el, "class", `${el.className.replace(/\bryder-dismissible\b/g, "").trim()} ryder-dismissible`.trim());
    if (el.querySelector(":scope > .ryder-dismiss-tip")) return;
    const button = doc.createElement("button"); button.type = "button"; button.className = "ryder-dismiss-tip"; button.textContent = "×";
    button.setAttribute("aria-label", "Dismiss tip"); button.dataset.touchControl = "true";
    button.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation(); dismissed.add(signatures.get(el)!); attr(el, "data-ryder-dismissed", "true"); el.inert = true;
    }, { signal: abort.signal });
    el.append(button); created.add(button); owned.add(el);
  }

  function scan() {
    if (disposed) return;
    const badge = doc.getElementById("sylens-badge");
    if (badge && badge.textContent !== RYDER_CREDIT) badge.textContent = RYDER_CREDIT;
    for (const title of Array.from(doc.querySelectorAll<HTMLElement>(".capy-cine-title"))) {
      const promotion = /@?leoco+ut|vibe\s*jam/i.test(title.textContent ?? "");
      if (title.parentElement) attr(title.parentElement, "data-ryder-promotion", promotion ? "true" : null);
    }
    for (const link of Array.from(doc.querySelectorAll<HTMLAnchorElement>(".capy-support,.capy-socials a,#sponsor-title"))) {
      attr(link, "href", null); attr(link, "data-ryder-promotion", "true");
    }
    for (const logo of Array.from(doc.querySelectorAll<HTMLImageElement>("#mp-menu-panel > img,.capy-intro-brand img,[data-cinematic-overlays] img,#capy-loading-screen img"))) {
      if (!logo.closest("#capy-loading-screen") && !/capylogo|capybara.*logo|logo.*capybara/i.test(logo.getAttribute("src") ?? "") && !/capybaras delivering/i.test(logo.alt)) continue;
      attr(logo, "src", "/images/ryder-wordmark.svg"); attr(logo, "alt", "Ryder");
      if (logo.closest("#capy-loading-screen") && logo.parentElement) attr(logo.parentElement, "data-ryder-loading-mark", "");
    }
    const mobile = doc.documentElement.hasAttribute("data-ryder-mobile");
    for (const key of Array.from(doc.querySelectorAll<HTMLElement>("#store-prompt .store-prompt-key"))) {
      const label = mobile ? "Tap Action" : "E / Action";
      if (key.textContent !== label) key.textContent = label;
    }
    for (const scope of Array.from(doc.querySelectorAll<HTMLElement>("#subtitle,#store-prompt,#mission-prompt"))) {
      const walker = doc.createTreeWalker(scope, 4);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest(".ryder-dismiss-tip")) continue;
        const text = node.textContent ?? "", replacement = actionCopy(text, mobile);
        if (replacement !== text) node.textContent = replacement;
      }
    }
    const phoneOpen = !!doc.querySelector("#phone-hud.phone-visible");
    if (doc.documentElement.hasAttribute("data-ryder-phone-open") !== phoneOpen) {
      if (phoneOpen) doc.documentElement.setAttribute("data-ryder-phone-open", ""); else doc.documentElement.removeAttribute("data-ryder-phone-open");
    }
    markMenu();
    for (const selector of ["#tips-box", "#subtitle", ".capy-controls-panel"]) {
      for (const el of Array.from(doc.querySelectorAll<HTMLElement>(selector))) dismissible(el, selector === ".capy-controls-panel" ? "controls" : selector);
    }
  }
  const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(scan);
  observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "href"] });
  scan();
  return { dispose() {
    if (disposed) return; disposed = true; disposePhoneLayout(); observer.disconnect(); abort.abort();
    if (win.open === guardedOpen) win.open = open;
    for (const restore of restores.reverse()) restore();
    for (const el of created) el.remove();
    for (const [el, map] of originals) for (const [name, value] of map) { if (value === null) el.removeAttribute(name); else el.setAttribute(name, value); }
    for (const el of owned) (el as HTMLElement).inert = false;
    doc.documentElement.removeAttribute("data-ryder-phone-open"); style.remove();
  } };
}
