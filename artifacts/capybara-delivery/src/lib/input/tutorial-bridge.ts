/** Recognize Ryder gestures at the canonical tutorial's existing transitions.
 * Native listeners recognize keyboard codes / original touch IDs, not Ryder IDs.
 * Never clear locks ourselves or skip earlier tutorial states.
 */
type TutorialGame = {
  tutorial?: {
    state?: string;
    _commandDone?: (state: string, next: () => void) => void;
    _enterPhoneBoot?: () => void;
    _enterMissionInFlight?: () => void;
  };
  phone?: { visible?: boolean; _tabDisabled?: boolean };
};

function game(win: Window | null): TutorialGame | undefined {
  return (win as unknown as { __capyGame?: TutorialGame } | null)?.__capyGame;
}

export function acknowledgePhoneOpen(win: Window | null): void {
  const g = game(win), tutorial = g?.tutorial;
  if (tutorial?.state !== "await_tab" || !g?.phone?.visible || g.phone._tabDisabled) return;
  if (tutorial._commandDone && tutorial._enterPhoneBoot) {
    tutorial._commandDone("await_tab", () => {
      if (tutorial.state === "await_tab") tutorial._enterPhoneBoot?.();
    });
  }
}

export function acknowledgeDrivingGesture(win: Window | null, event: PointerEvent): void {
  if (!event.isTrusted) return;
  const tutorial = game(win)?.tutorial;
  if (tutorial?.state === "teach_controls") tutorial._enterMissionInFlight?.();
}
