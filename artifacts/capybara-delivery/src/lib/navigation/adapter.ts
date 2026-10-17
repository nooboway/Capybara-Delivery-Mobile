/** Read-only copies of canonical Phone presentation data; never physics objects. */
export type Point = { x: number; z: number };
export type Road = { kind: string; points: Point[] };
export interface NavigationSnapshot {
  phase: "drive-to-store" | "delivering";
  player: Point; heading: number; target: Point; distance: number;
  relativeBearing: number; label: string; roads: Road[]; route: Point[];
}
interface PhoneMirror {
  phase?: string; activeOrder?: { customer?: unknown; destination?: unknown } | null;
  _playerPos?: Point & { angle?: number }; _storePos?: Point; _deliveryPos?: Point;
  _mapRoads?: Array<{ kind?: string; points?: number[][] }>; _mapRoute?: Point[] | null;
}
export interface NavigationGame { mode?: string; phone?: PhoneMirror }
const point = (p: Point | undefined): Point | null => p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { x: p.x, z: p.z } : null;
const text = (s: unknown) => typeof s === "string" ? s.slice(0, 80).trim() : "";
export class RyderNavigationAdapter {
  private roads = new WeakMap<object, Road[]>();
  read(game: NavigationGame | undefined): NavigationSnapshot | null {
    const p = game?.phone;
    if (!p?.activeOrder || (game?.mode !== "world" && game?.mode !== "driving")) return null;
    const phase = p.phase;
    if (phase !== "drive-to-store" && phase !== "delivering") return null;
    const player = point(p._playerPos), target = point(phase === "drive-to-store" ? p._storePos : p._deliveryPos);
    const heading = p._playerPos?.angle;
    if (!player || !target || typeof heading !== "number" || !Number.isFinite(heading)) return null;
    let roads: Road[] = [];
    if (Array.isArray(p._mapRoads)) {
      const source = p._mapRoads;
      const cached = this.roads.get(source);
      if (cached) roads = cached;
      else {
        let budget = 12000;
        for (const road of source.slice(0, 256)) {
          if (!Array.isArray(road.points) || budget <= 0) continue;
          const points: Point[] = [];
          for (const pair of road.points.slice(0, Math.min(96, budget))) {
            if (!Array.isArray(pair)) continue;
            const q = point({ x: pair[0], z: pair[1] }); if (q) points.push(q);
          }
          budget -= points.length; if (points.length > 1) roads.push({ kind: road.kind ?? "", points });
        }
        this.roads.set(source, roads);
      }
    }
    const route = Array.isArray(p._mapRoute) ? p._mapRoute.slice(0, 128).flatMap(q => { const r = point(q); return r ? [r] : []; }) : [];
    const dx = target.x - player.x, dz = target.z - player.z;
    const bearing = Math.atan2(dx, dz) - heading;
    return { phase, player, heading, target, distance: Math.hypot(dx, dz), relativeBearing: Math.atan2(Math.sin(bearing), Math.cos(bearing)),
      label: phase === "drive-to-store" ? "Grocery pickup" : [text(p.activeOrder.customer), text(p.activeOrder.destination)].filter(Boolean).join(" · ") || "Customer", roads, route };
  }
}
