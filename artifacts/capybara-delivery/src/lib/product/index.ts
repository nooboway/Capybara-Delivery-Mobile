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
    // Derive the action footer from semantic button labels/structure, not style names.
    for (const play of Array.from(panel.querySelectorAll<HTMLButtonElement>("button"))) {
      if (!/^(?:Play|Jogar|Jugar|Spielen|开始|플레이|खेलें)$/iu.test(play.textContent?.trim() ?? "") || play.closest(".ryder-play-footer")) continue;
      const parent = play.parentElement!;
      const back = Array.from(parent.querySelectorAll<HTMLButtonElement>(":scope > button")).find(b => /^(Back|Voltar|Atrás|Zurück|返回|뒤로|वापस)$/iu.test(b.textContent?.trim() ?? ""));
      if (!back) continue;
      if (parent.children.length === 2) { attr(parent, "class", `${parent.className} ryder-play-footer`.trim()); continue; }
      const footer = doc.createElement("div"); footer.className = "ryder-play-footer";
      const markers = [play, back].map(b => { const marker = doc.createComment("Ryder footer restore"); b.before(marker); return { b, marker }; });
      parent.append(footer); footer.append(play, back); created.add(footer);
      restores.push(() => { for (const { b, marker } of markers) marker.replaceWith(b); });
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
    if (disposed) return; disposed = true; observer.disconnect(); abort.abort();
    if (win.open === guardedOpen) win.open = open;
    for (const restore of restores.reverse()) restore();
    for (const el of created) el.remove();
    for (const [el, map] of originals) for (const [name, value] of map) { if (value === null) el.removeAttribute(name); else el.setAttribute(name, value); }
    for (const el of owned) (el as HTMLElement).inert = false;
    doc.documentElement.removeAttribute("data-ryder-phone-open"); style.remove();
  } };
}
