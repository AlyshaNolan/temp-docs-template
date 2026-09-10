/**
 * Language tabs, with the reader's choice remembered site-wide — a Python
 * developer stays in Python across every page. Registered in
 * `editor-live-sync.js` too, because inline scripts don't run in the editor.
 *
 * The choice is stored per tab *label*, not per block: two blocks offering
 * "Node" and "Python" agree, and a block that doesn't offer the stored label
 * keeps its own first tab rather than showing nothing.
 */
const STORAGE_KEY = "docs:code-language";

function readStoredLabel(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLabel(label: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, label);
  } catch {
    /* Private mode or blocked storage — the tabs still work for this page. */
  }
}

function activate(root: HTMLElement, label: string): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const target = tabs.find((tab) => tab.dataset.label === label);

  if (!target) return;

  for (const tab of tabs) {
    const selected = tab === target;
    const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");

    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (panel) panel.hidden = !selected;
  }
}

export function setupCodeTabs(root: HTMLElement): void {
  if (root.hasAttribute("data-code-tabs-initialized")) return;
  root.setAttribute("data-code-tabs-initialized", "");

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

  if (!tabs.length) return;

  const stored = readStoredLabel();

  if (stored && tabs.some((tab) => tab.dataset.label === stored)) activate(root, stored);

  root.addEventListener("click", (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');

    if (!tab?.dataset.label) return;

    storeLabel(tab.dataset.label);
    // Every block on the page follows, which is the point of remembering it.
    document
      .querySelectorAll<HTMLElement>(".code-tabs")
      .forEach((block) => activate(block, tab.dataset.label as string));
  });

  root.addEventListener("keydown", (event) => {
    const key = (event as KeyboardEvent).key;

    if (key !== "ArrowLeft" && key !== "ArrowRight") return;

    const current = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    const next = tabs[(current + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];

    event.preventDefault();
    next.focus();
    next.click();
  });
}

export function setupAllCodeTabs(): void {
  document.querySelectorAll<HTMLElement>(".code-tabs").forEach(setupCodeTabs);
}
