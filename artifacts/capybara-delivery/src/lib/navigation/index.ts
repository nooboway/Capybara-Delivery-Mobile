import { RyderNavigationAdapter, type NavigationGame, type NavigationSnapshot, type Point } from "./adapter";
export interface NavigationHandle { dispose(): void }
/** Independent UI timer. No render hooks, physics reads, input writes or mission state. */
export function installNavigationHud(win: Window, doc: Document, outerVisible: () => boolean): NavigationHandle {
  const adapter = new RyderNavigationAdapter();
  const root = doc.createElement("aside"); root.id = "ryder-navigation"; root.hidden = true; root.setAttribute("aria-label", "Delivery navigation");
  root.innerHTML = '<canvas width="136" height="108" aria-hidden="true"></canvas><div class="ryder-nav-copy"><div class="ryder-nav-course"><span class="ryder-nav-arrow" aria-hidden="true">↑</span><strong></strong></div><span class="ryder-nav-label"></span></div>';
  const style = doc.createElement("style"); style.id = "ryder-navigation-styles";
  style.textContent = `
    #ryder-navigation{--nav-width:min(208px,30vw);position:fixed;top:var(--okada-safe-top,14px);left:var(--okada-safe-left,20px);width:var(--nav-width);height:78px;box-sizing:border-box;padding:8px;display:flex;gap:8px;align-items:center;border:1px solid #ffffff35;border-radius:14px;background:#101b26ed;color:#fff;font:12px system-ui;z-index:160;contain:layout paint}
    #ryder-navigation[hidden]{display:none!important}#ryder-navigation,#ryder-navigation *{pointer-events:none!important;user-select:none}
    #ryder-navigation canvas{width:68px;height:54px;border-radius:7px;flex:0 0 68px;background:#172d35}
    .ryder-nav-copy{min-width:0;flex:1}.ryder-nav-course{display:flex;align-items:center;gap:7px;height:27px}.ryder-nav-arrow{display:block;font-size:25px;line-height:1}.ryder-nav-course strong{font-size:18px;font-variant-numeric:tabular-nums;white-space:nowrap}.ryder-nav-label{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:10px;line-height:13px;overflow-wrap:anywhere;color:#d3e1e5}
    html[data-ryder-nav-visible] #tips-box,html[data-ryder-nav-visible] .capy-controls-panel{left:calc(var(--okada-safe-left,20px) + min(208px,30vw) + 12px)!important;right:auto!important;top:var(--okada-safe-top,14px)!important;bottom:auto!important;transform:none!important;width:calc(100vw - var(--okada-safe-left,20px) - var(--okada-safe-right,20px) - min(208px,30vw) - 180px)!important;max-width:300px!important;max-height:78px!important;overflow:auto;font-size:12px!important;padding-top:6px!important;padding-bottom:6px!important}
  `;
  doc.head.append(style); doc.body.append(root);
  const canvas = root.querySelector("canvas")!, ctx = canvas.getContext("2d"), distance = root.querySelector("strong")!, label = root.querySelector<HTMLElement>(".ryder-nav-label")!, arrow = root.querySelector<HTMLElement>(".ryder-nav-arrow")!;
  let tick = 0, disposed = false;
  const draw = (s: NavigationSnapshot) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 136, 108);
    const xy = (p: Point) => ({ x: 68 + (p.x - s.player.x) * 1.2, y: 54 + (p.z - s.player.z) * 1.2 });
    const line = (points: Point[], color: string, width: number) => {
      ctx.beginPath(); points.forEach((p, i) => { const q = xy(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.stroke();
    };
    for (const road of s.roads) line(road.points, road.kind === "dirt" ? "#697966" : "#718691", 5);
    if (s.route.length > 1) line(s.route, "#8ee4cd", 2.5);
    const t = xy(s.target); ctx.fillStyle = "#ffda79"; ctx.beginPath(); ctx.arc(Math.max(7, Math.min(129, t.x)), Math.max(7, Math.min(101, t.y)), 5, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(68, 54); ctx.rotate(Math.PI - s.heading); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); ctx.restore();
  };
  const update = () => {
    if (disposed) return;
    const state = doc.getElementById("okada-phase1-controls-root")?.dataset.state;
    const visible = outerVisible() && !doc.hidden && doc.body.classList.contains("in-game") && state === "WORLD" && !doc.querySelector("#phone-hud.phone-visible") && win.innerWidth > win.innerHeight;
    const snapshot = visible ? adapter.read((win as Window & { __capyGame?: NavigationGame }).__capyGame) : null;
    root.hidden = !snapshot;
    doc.documentElement.toggleAttribute("data-ryder-nav-visible", !!snapshot);
    if (!snapshot) return;
    root.dataset.phase = snapshot.phase; root.dataset.distance = String(snapshot.distance); root.dataset.targetX = String(snapshot.target.x); root.dataset.targetZ = String(snapshot.target.z);
    const formatted = snapshot.distance >= 1000 ? `${(snapshot.distance / 1000).toFixed(1)} km` : `${Math.round(snapshot.distance)} m`;
    if (distance.textContent !== formatted) distance.textContent = formatted;
    if (label.textContent !== snapshot.label) label.textContent = snapshot.label;
    arrow.style.transform = `rotate(${snapshot.relativeBearing * 180 / Math.PI}deg)`;
    if (++tick % 4 === 1) draw(snapshot);
  };
  const timer = win.setInterval(update, 125); update();
  return { dispose() { if (disposed) return; disposed = true; win.clearInterval(timer); root.remove(); style.remove(); doc.documentElement.removeAttribute("data-ryder-nav-visible"); } };
}
