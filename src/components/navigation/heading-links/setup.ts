/**
 * Clicking a prose heading copies a link to that section.
 *
 * The affordance is the `#` CSS adds on hover (see `base/_prose.css`); this
 * makes it work. Registered in `editor-live-sync.js` too, because inline
 * scripts don't run in the CloudCannon editor.
 */
const TOAST_MS = 1600;

let bound = false;

function showToast(message: string): void {
  let toast = document.querySelector<HTMLElement>(".heading-link-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "heading-link-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.dataset.visible = "";
  clearTimeout(Number(toast.dataset.timer));
  toast.dataset.timer = String(setTimeout(() => delete toast.dataset.visible, TOAST_MS));
}

export function setupHeadingLinks(): void {
  // Bound once at document level, resolving the heading at event time, so
  // Astro view transitions can't stack listeners on detached DOM.
  if (bound) return;
  bound = true;

  document.addEventListener("click", (event) => {
    const heading = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      ".prose h2[id], .prose h3[id]"
    );

    // Steps render their own card headings; those carry no anchor affordance
    // (see `base/_prose.css`), so they must not copy a link either.
    if (!heading || heading.closest(".step-content")) return;

    event.preventDefault();

    const url = `${location.href.split("#")[0]}#${heading.id}`;

    history.replaceState(null, "", `#${heading.id}`);
    navigator.clipboard
      ?.writeText(url)
      .then(() => showToast("Link to this section copied"))
      .catch(() => {});
  });
}
