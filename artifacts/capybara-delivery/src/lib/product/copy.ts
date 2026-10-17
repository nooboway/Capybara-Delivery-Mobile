export const RYDER_CREDIT = "Remixed by Sylens Studios ™";

/** Rendered interaction copy only; never alters canonical command state. */
export function actionCopy(text: string, mobile: boolean): string {
  return text.replace(/\b(?:Press|Tap|Use)\s*(?:\[E\]|E\b)(?!\s*\/\s*Action)/gi, mobile ? "Tap Action" : "Press E / Action")
    .replace(/\bE to (enter|collect|pick up|deliver|interact)\b/gi, mobile ? "Action to $1" : "E / Action to $1");
}
