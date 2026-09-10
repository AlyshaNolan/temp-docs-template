/**
 * Shared setup logic for the Search component.
 *
 * Used by:
 * - `Search.astro`'s inline `<script>` on the live site
 * - `editor-live-sync.js` in the CloudCannon editor, where inline scripts
 *   don't run
 *
 * Importing `@pagefind/component-ui` registers the `<pagefind-*>` custom
 * elements. The search index under `/pagefind/` only exists on built sites
 * (`npm run build` runs the Pagefind CLI); in `astro dev` run
 * `npm run search:dev` to generate one, otherwise the modal shows its
 * index-unavailable notice instead of results.
 */

import { getInstanceManager } from "@pagefind/component-ui";

import { setupModalShell } from "../../building-blocks/wrappers/modal/setup";

let keyboardShortcutBound = false;
let errorHookBound = false;

function currentSearchPopover(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".search .modal-popover");
}

/** Cmd/Ctrl+K toggles the search modal. Bound once at document level and
 * resolving the popover at event time, so Astro view transitions can't
 * accumulate listeners pointing at detached DOM. */
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

/** How many matched headings to list under a page. Past three the overlay
 *  stops being a shortlist and becomes the page itself. */
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

/** Render each result by cloning the build-time `SearchResult.astro`
 * template and filling in the data. Pagefind calls this via the
 * `resultTemplate` property, which wins over its own string templates. */
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

      // Excerpts carry <mark> highlight markup from our own index.
      if (excerpt && result.excerpt) excerpt.innerHTML = result.excerpt;
      else excerpt?.remove();
    }

    // Sub-results are the headings that matched. Showing them is what makes a
    // result land on the section a reader wanted rather than the top of a long
    // page — the first one always repeats the page itself, so it is dropped.
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

  // Escape closes the modal — and does nothing else. Two things otherwise eat
  // it: Pagefind's input binds a target-phase handler that clears the query,
  // and a non-empty `<input type="search">` consumes Escape as a native reset,
  // which spends the close request so the overlay needs a second press. So the
  // event is swallowed in the capture phase and the close is done here.
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

  // Registered once module-wide, resolving the search element at fire time,
  // so view transitions can't stack callbacks holding detached DOM.
  if (!errorHookBound) {
    errorHookBound = true;
    instance.on("error", () => {
      document
        .querySelectorAll<HTMLElement>(".search")
        .forEach((el) => el.setAttribute("data-search-unavailable", ""));
    });
  }

  // Load the index as soon as the modal opens so the first keystroke
  // searches instantly — and so a missing index surfaces the unavailable
  // notice before the user types.
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
