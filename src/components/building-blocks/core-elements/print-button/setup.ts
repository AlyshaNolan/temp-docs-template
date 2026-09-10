/**
 * Opens the browser's print dialog. Registered in `editor-live-sync.js` as well
 * as the component's inline script, because inline scripts don't run in the
 * CloudCannon editor.
 *
 * There is no markup-only way to do this — no `href` or form action opens the
 * print dialog — so the control is rendered `hidden` and revealed here. A
 * button that can't do anything is worse than no button.
 */
export function setupPrintButton(root: HTMLElement): void {
  if (root.hasAttribute("data-print-initialized")) return;
  root.setAttribute("data-print-initialized", "");

  const button = root.querySelector<HTMLButtonElement>("button");

  if (!button) return;

  root.hidden = false;
  button.addEventListener("click", () => window.print());
}

export function setupAllPrintButtons(): void {
  document.querySelectorAll<HTMLElement>(".print-button").forEach(setupPrintButton);
}
