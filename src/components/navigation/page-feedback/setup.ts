/**
 * Submits the helpful vote without leaving the page. Registered in
 * `editor-live-sync.js` as well as the component's inline script, because
 * inline scripts don't run in the CloudCannon editor.
 *
 * Progressive enhancement only: with JS off the form is a plain POST, which is
 * what makes the default CloudCannon Forms action work with no code at all.
 */
export function setupPageFeedback(root: HTMLElement): void {
  if (root.hasAttribute("data-feedback-initialized")) return;
  root.setAttribute("data-feedback-initialized", "");

  const form = root.querySelector<HTMLFormElement>("form");
  const status = root.querySelector<HTMLElement>(".page-feedback-status");

  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;

    event.preventDefault();

    const body = new FormData(form);

    if (submitter?.name) body.append(submitter.name, submitter.value);

    // The vote is advisory: a failed POST must not put an error in the reader's
    // way, so the thank-you state is shown either way.
    fetch(form.action, { method: "post", body }).catch(() => {});

    root.setAttribute("data-voted", submitter?.value || "yes");
    status.hidden = false;
    status.focus();
  });
}

export function setupAllPageFeedback(): void {
  document.querySelectorAll<HTMLElement>(".page-feedback").forEach(setupPageFeedback);
}
