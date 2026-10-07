// Also imported by `editor-live-sync.js`. The index exists only after a build;
// in `astro dev` run `npm run search:dev` or the modal shows its unavailable notice.

import { getInstanceManager } from "@pagefind/component-ui";

import { setupModalShell } from "../../building-blocks/wrappers/modal/setup";

let keyboardShortcutBound = false;
let errorHookBound = false;

function currentSearchPopover(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".search .modal-popover");
}

/** Bound once, resolving the popover at event time, so view transitions can't stack listeners. */
function bindKeyboardShortcut(): void {
  if (keyboardShortcutBound) return;
  keyboardShortcutBound = true;

  document.addEventListener("keydown", (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    if (e.key.toLowerCase() !== "k") return;

    const popover = currentSearchPopover();

    if (!popover) return;
    e.preventDefault();

    if (popover.matches(":popover-open")) {
      popover.hidePopover();
    } else {
      popover.showPopover();
    }
  });
}

const MAX_SUB_RESULTS = 3;

type PagefindSubResult = {
  url: string;
  title: string;
  excerpt: string;
};

type PagefindResult = {
  url?: string;
  excerpt?: string;
  meta?: Record<string, string>;
  sub_results?: PagefindSubResult[];
};

/** Clones the `SearchResult.astro` template; `resultTemplate` overrides Pagefind's own. */
function bindResultTemplate(search: HTMLElement): void {
  const results = search.querySelector<
    HTMLElement & { resultTemplate?: (_result: PagefindResult) => Node | string }
  >("pagefind-results");
  const template = search.querySelector<HTMLTemplateElement>("template.search-result-template");

  if (!results || !template) return;

  results.resultTemplate = (result) => {
    const item = template.content.firstElementChild?.cloneNode(true) as HTMLElement | null;

    if (!item) return "";

    const meta = result.meta ?? {};
    const url = meta.url || result.url || "";
    const link = item.querySelector<HTMLAnchorElement>(".search-result-link");

    if (link) {
      if (url && !/^\s*javascript:/i.test(url)) link.href = url;

      const title = link.querySelector(".search-result-title");

      if (title) title.textContent = meta.title || "Untitled";

      const excerpt = link.querySelector(".search-result-excerpt");

      // Trusted: <mark> markup from our own index.
      if (excerpt && result.excerpt) excerpt.innerHTML = result.excerpt;
      else excerpt?.remove();
    }

    // The first sub-result repeats the page itself.
    const subs = item.querySelector(".search-result-subs");
    const subTemplate = subs?.firstElementChild as HTMLElement | undefined;
    const sections = (result.sub_results ?? []).filter((sub) => sub.url && sub.url !== url);

    if (subs && subTemplate && sections.length > 0) {
      subs.replaceChildren(
        ...sections.slice(0, MAX_SUB_RESULTS).map((sub) => {
          const row = subTemplate.cloneNode(true) as HTMLElement;
          const subLink = row.querySelector<HTMLAnchorElement>(".search-result-sub-link");
          const subTitle = row.querySelector(".search-result-sub-title");
          const subExcerpt = row.querySelector(".search-result-sub-excerpt");

          if (subLink && !/^\s*javascript:/i.test(sub.url)) subLink.href = sub.url;
          if (subTitle) subTitle.textContent = sub.title || "";
          if (subExcerpt && sub.excerpt) subExcerpt.innerHTML = sub.excerpt;
          else subExcerpt?.remove();

          return row;
        })
      );
    } else {
      subs?.remove();
    }

    return item;
  };
}

export function setupSearch(search: HTMLElement): void {
  if (search.hasAttribute("data-search-initialized")) return;
  search.setAttribute("data-search-initialized", "");

  const popover = search.querySelector<HTMLElement>(".modal-popover");

  if (!popover) return;

  setupModalShell(popover);
  bindKeyboardShortcut();

  // Capture phase: Pagefind's input and the native search reset otherwise eat
  // Escape, so a non-empty query would need a second press to close.
  popover.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;

      e.stopPropagation();
      e.preventDefault();
      popover.hidePopover();
    },
    true
  );

  const instance = getInstanceManager().getInstance("default");

  // Once module-wide, so view transitions can't stack callbacks on detached DOM.
  if (!errorHookBound) {
    errorHookBound = true;
    instance.on("error", () => {
      document
        .querySelectorAll<HTMLElement>(".search")
        .forEach((el) => el.setAttribute("data-search-unavailable", ""));
    });
  }

  popover.addEventListener("toggle", (e) => {
    if ((e as ToggleEvent).newState === "open") {
      instance.triggerLoad().catch(() => {});
    }
  });

  bindResultTemplate(search);
}

export function setupAllSearch(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(".search").forEach((el) => setupSearch(el));
}
