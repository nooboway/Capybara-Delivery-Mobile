# Mobile UX — Assessment & Recommendation

> Verified facts and recommendations for a professional mobile arcade feel.

## 1. Orientation & viewport

**VERIFIED** — The game is a landscape 3D driving game; the shipped UI assumes desktop. The shell adds `viewport-fit=cover, maximum-scale=1` (`index.html:5`).

**RECOMMENDATION** — Enforce landscape; lock the shell to landscape presentation and reject double-tap-zoom/rubber-banding via `touch-action: none` + `user-select: none` on the shell and canvas.

## 2. Competing UI ownership (verified)

There are **two** independent UI owners rendering on top of each other:

1. **React host** (`App.tsx`) — toolbar (Mobile / Touch / Fullscreen) fixed top-right, and the mobile modal.
2. **Game iframe** — `#top-right-controls` (Settings / Reposition) fixed top-right, `#phone-hud` (virtual smartphone) bottom-right, `#mobile-controls` (touch buttons) bottom corners.

**VERIFIED** — The host toolbar and the game's top-right controls occupy the same corner (`index.css` toolbar top-right vs. game `index.html` top-right), producing tap collisions on landscape phones. The `#phone-hud` overlaps the `DRIFT`/`E` buttons on narrow widths.

**RECOMMENDATION** — **Single authoritative UI layer.** Move host utilities (fullscreen, settings, "play on mobile") into the game's own UI (or a merged top-left drawer) so the game owns the full HUD; remove the host overlay entirely.

## 3. HUD hierarchy & safe areas

**RECOMMENDATION**
- Apply `env(safe-area-inset-*)` to all touch controls and the phone HUD (notch/gesture-bar safe).
- Left thumb: analog steering (bottom-left). Right thumb: accelerator + brake + drift + interact (bottom-right). Keep the phone/delivery HUD in a collapsible top-center/bottom-sheet, away from thumb zones.
- Minimum touch target 44×44 pt (currently 60–92 px buttons — acceptable, but the fixed hitboxes must become capture-based).

## 4. Interaction flows

- **Order notification**: keep in-game `#phone-hud` (CapyFood) as the single offer surface; ensure `.btn-offer-accept` is thumb-reachable and not obscured.
- **Store**: analog `Di` joystick (360°) + contextual "grab/exit" button.
- **Delivery**: contextual interact button at destination.
- **Onboarding**: short, skippable overlay showing "steer (left) / gas + brake (right) / drift / interact" once.

## 5. Accessibility & feel

- **Haptics**: `navigator.vibrate` on drift-start, boost, delivery success (must run inside the game context to satisfy iOS gesture rules).
- **Audio unlock**: resume `__capyAudio.ctx` on the *first in-game* gesture, not on the outer shell (cross-iframe gesture is unreliable).
- **Customization**: control scheme toggle (analog stick vs. tilt vs. buttons), and button size/opacity options.

## 6. What must change vs. what stays

| Item | Verdict |
| :--- | :--- |
| Host toolbar / modal (React) | **Remove / merge into game** |
| In-game top-right controls | Keep, but de-conflict |
| `#phone-hud` | Keep, re-dock for landscape + safe areas |
| Native touch buttons + joystick | Keep, upgrade to analog + capture |
| Fullscreen | Keep (game-initiated; iOS needs `webkitEnterFullscreen`/`playsinline` strategy) |
