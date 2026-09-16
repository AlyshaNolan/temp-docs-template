/**
 * Live-updates the parts of the docs navigation that no editable region can
 * bind to, in the CloudCannon Visual Editor.
 *
 * Regions own everything stored in one file: an `@data[key].path` prop binds
 * across files, so the topbar brand and links, the footer, and the Home and
 * current crumbs are plain regions on their own components. What is left here
 * is what `getDocsNav()` *derives* by joining the whole `docs` collection with
 * `docsSite.json` — where a page sits in the sidebar, and the group crumb. No
 * single path holds those, so there is nothing for a region to bind to and the
 * JavaScript API is the only route: subscribe, re-read, patch the DOM.
 *
 * What is deliberately NOT re-derived here: group *membership*, page nesting,
 * and the pager. All three need every doc's frontmatter, not the open file's.
 * Reimplementing `getDocsNav()` against the API would give the sidebar a second
 * ordering that nothing keeps in sync with the build. Only the open page moves,
 * and only between groups the build already rendered — plus one it did not,
 * which is cloned from a sibling.
 *
 * Booleans have no region type at all, so the editor switches are patched here
 * too. Each control they gate is always rendered and carries
 * `data-toggle-hidden` when off: gating at build time leaves the editor no
 * element to reveal when the switch goes back on. A control's visibility is the
 * AND of a page switch and a site switch, so both handles feed one pass.
 *
 * Group names are not a region for the same reason. `navGroups` sets order and
 * collapsed state only; membership comes from each page's `group` frontmatter,
 * so renaming an entry there orphans the old name into `getDocsNav()`'s
 * alphabetical tail. A text region on the label would write the rename and show
 * it taking, which the rebuild then undoes. The reorder below reproduces the
 * tail instead.
 */

import type {
  CloudCannonEditorWindow,
  CloudCannonJavaScriptV1API,
} from "@cloudcannon/javascript-api";
import { asRecord, framed, resolveDataSource } from "@component-utils/editorData";
import { onPageLoad } from "@component-utils/onPageLoad";
import { comparePages, orderGroupNames } from "@utils/navOrder";

declare const window: CloudCannonEditorWindow;

const DOCS_SITE = { dataset: "docsSite", path: "src/data/docsSite.json" };
const ANNOUNCEMENT = { dataset: "announcementBar", path: "src/data/announcementBar.json" };

const text = (value: unknown) => String(value ?? "").trim();

function docTrail(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".doc-breadcrumbs");
}

/** The crumb is an editable region; the sidebar link is derived and is not. */
function setPageTitle(title: string) {
  const link = sidebar()?.querySelector<HTMLElement>('li[data-href] > a[aria-current="page"]');

  if (title && link) link.textContent = title;
}

/**
 * The group crumb is the only url-less crumb that is not the current page — a
 * parent-page crumb always renders as a link.
 */
function setGroupCrumb(name: string) {
  const trail = docTrail();

  if (!trail) return;

  const existing = trail.querySelector<HTMLElement>(".breadcrumbs-current:not([aria-current])");

  if (!name) {
    existing?.closest(".breadcrumbs-item")?.remove();

    return;
  }

  if (existing) {
    existing.textContent = name;

    return;
  }

  const current = trail.querySelector<HTMLElement>('.breadcrumbs-current[aria-current="page"]');
  const home = trail.querySelector<HTMLElement>(".breadcrumbs-trail > .breadcrumbs-item");
  const template = current?.closest(".breadcrumbs-item");

  if (!template || !home) return;

  const item = template.cloneNode(true) as HTMLElement;
  const label = item.querySelector<HTMLElement>(".breadcrumbs-current");

  label?.removeAttribute("aria-current");

  if (label) label.textContent = name;

  home.after(item);
}

const sidebar = () => document.querySelector<HTMLElement>(".docs-sidebar");

function currentItem(): HTMLElement | null {
  return (
    sidebar()?.querySelector<HTMLElement>('li[data-href] > a[aria-current="page"]')
      ?.parentElement ?? null
  );
}

const itemTitle = (item: Element) => item.querySelector(":scope > a")?.textContent?.trim() ?? "";
const itemOrder = (item: HTMLElement) => Number(item.dataset.order ?? 0);

const asOrdered = (item: HTMLElement) => ({ order: itemOrder(item), title: itemTitle(item) });

function placeByOrder(list: HTMLElement, item: HTMLElement) {
  const siblings = [...list.querySelectorAll<HTMLElement>(":scope > li[data-href]")].filter(
    (sibling) => sibling !== item
  );

  const after = siblings.find((sibling) => comparePages(asOrdered(sibling), asOrdered(item)) > 0);

  if (after) after.before(item);
  else list.append(item);
}

function groupElements(): HTMLElement[] {
  return [...(sidebar()?.querySelectorAll<HTMLElement>(".docs-sidebar-group") ?? [])];
}

const groupNamed = (name: string) =>
  groupElements().find((group) => group.dataset.group === name) ?? null;

const groupList = (group: HTMLElement) =>
  group.querySelector<HTMLElement>(":scope > .docs-sidebar-list");

/** A group with no pages is not rendered, so moving into one means building it. */
function createGroup(name: string): HTMLElement | null {
  const template = groupElements()[0];
  const inner = sidebar()?.querySelector<HTMLElement>(".docs-sidebar-inner");

  if (!template || !inner) return null;

  const group = template.cloneNode(true) as HTMLElement;
  const label = group.querySelector<HTMLElement>(".docs-sidebar-group-label span");
  const list = groupList(group);

  group.dataset.group = name;
  group.classList.remove("is-collapsible");
  (group as HTMLDetailsElement).open = true;

  if (label) label.textContent = name;

  if (list) list.replaceChildren();

  inner.append(group);

  return group;
}

const isNested = (item: HTMLElement) =>
  item.parentElement?.classList.contains("docs-sidebar-children") === true;

/** A group the build rendered only because this page was in it. */
function pruneGroup(group: HTMLElement | null | undefined) {
  if (group && !groupList(group)?.querySelector(":scope > li[data-href]")) group.remove();
}

/** A page with no `group` has no sidebar entry at all, so gaining one builds it. */
function createItem(title: string, order: number): HTMLElement | null {
  const template = sidebar()?.querySelector<HTMLElement>("li[data-href]");

  if (!template) return null;

  const item = template.cloneNode(true) as HTMLElement;
  const link = item.querySelector<HTMLAnchorElement>(":scope > a");

  item.querySelector(":scope > .docs-sidebar-children")?.remove();
  item.dataset.href = location.pathname;
  item.dataset.order = String(order);

  if (!link) return null;

  link.setAttribute("href", location.pathname);
  link.setAttribute("aria-current", "page");
  link.textContent = title;

  return item;
}

/**
 * Move the open page between sidebar groups, and keep the group crumb with it.
 * Clearing the group drops the page out of the nav, which is what the build
 * does with a page that has none.
 */
function setPageGroup(name: string, title: string, order: number) {
  const existing = currentItem();

  // A nested page inherits its parent's group, so its own frontmatter is inert.
  if (existing && isNested(existing)) return;

  setGroupCrumb(name);

  const from = existing?.closest<HTMLElement>(".docs-sidebar-group") ?? null;

  if (!name) {
    existing?.remove();
    pruneGroup(from);

    return;
  }

  if (from && from.dataset.group === name) return;

  const item = existing ?? createItem(title, order);
  const target = groupNamed(name) ?? createGroup(name);
  const list = target && groupList(target);

  if (!item || !list) return;

  placeByOrder(list, item);
  (target as HTMLDetailsElement).open = true;

  if (from !== target) pruneGroup(from);
}

function setPageOrder(order: number) {
  const item = currentItem();
  const list = item?.parentElement;

  if (!item || !list) return;

  item.dataset.order = String(order);
  placeByOrder(list, item);
}

function setLeadLabel(label: string) {
  const lead = sidebar()?.querySelector<HTMLElement>("[data-nav-lead] a");

  if (lead) lead.textContent = label || "Overview";
}

/**
 * Last-applied collapsed state per group. Re-asserting `open` on every read
 * would snap shut a group the editor had just expanded by hand.
 */
const collapsedState = new Map<string, boolean>();

function setGroups(navGroups: Record<string, unknown>[]) {
  const inner = sidebar()?.querySelector<HTMLElement>(".docs-sidebar-inner");

  if (!inner) return;

  const configured = navGroups.map((group) => text(group.name)).filter(Boolean);
  const present = groupElements()
    .map((group) => group.dataset.group ?? "")
    .filter(Boolean);

  for (const name of orderGroupNames(configured, present)) {
    const group = groupNamed(name);

    if (!group) continue;

    inner.append(group);

    const collapsed = navGroups.find((entry) => text(entry.name) === name)?.collapsed === true;

    group.classList.toggle("is-collapsible", collapsed);

    if (collapsedState.get(name) !== collapsed) {
      collapsedState.set(name, collapsed);
      (group as HTMLDetailsElement).open =
        !collapsed || Boolean(group.querySelector("[aria-current]"));
    }
  }
}

/**
 * Bumped on every page load. A client-side navigation swaps in freshly built
 * DOM and a new current file; listeners still bound to the old one check this
 * and no-op rather than writing the previous page's title into the new chrome.
 */
let generation = 0;

/**
 * Last value seen from each handle. A control gated by both a page switch and a
 * site switch has to be recomputed when either fires, so neither pass can act
 * on its own half alone.
 */
let pageData: Record<string, unknown> = {};
let siteData: Record<string, unknown> = {};

const on = (value: unknown) => value !== false && value !== undefined;

function setToggled(selector: string, visible: boolean) {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.toggleAttribute("data-toggle-hidden", !visible);
  });
}

function applyToggles() {
  const copyPage = asRecord(siteData.copyPage);
  const feedback = asRecord(siteData.feedback);
  const showToc = on(pageData.showToc);

  setToggled(".copy-page", on(pageData.showCopyPage) && on(copyPage.enabled));
  setToggled(".page-feedback", on(pageData.showFeedback) && on(feedback.enabled));
  setToggled(".docs-pager", on(pageData.showPager));
  setToggled(".docs-toc-rail > .toc", showToc);
  setToggled(".search", on(siteData.search));
  setToggled(".theme-toggle", on(siteData.themeToggle));

  // The rail keeps its grid column while it holds a hidden table of contents.
  const shell = document.querySelector<HTMLElement>(".docs-shell");
  const rail = document.querySelector(".docs-toc-rail > .toc");

  if (shell && rail) shell.classList.toggle("is-wide", !showToc);
}

function subscribe(
  emitters: { addEventListener(event: "change", fn: () => void): void }[],
  repaint: () => void
) {
  for (const emitter of emitters) emitter.addEventListener("change", repaint);

  repaint();
}

async function connectDataFiles(api: CloudCannonJavaScriptV1API) {
  const docsSite = await resolveDataSource(api, DOCS_SITE);

  if (docsSite) {
    subscribe(
      docsSite.emitters,
      framed(async () => {
        const data = asRecord(await docsSite.file.data.get());
        const navGroups = Array.isArray(data.navGroups) ? data.navGroups.map(asRecord) : [];

        siteData = data;

        setLeadLabel(text(data.homeLabel));
        setGroups(navGroups);
        applyToggles();
      })
    );
  } else {
    console.warn(`[siteChrome] ${DOCS_SITE.path} is not editable here.`);
  }

  const announcement = await resolveDataSource(api, ANNOUNCEMENT);

  if (announcement) {
    subscribe(
      announcement.emitters,
      framed(async () => {
        const data = asRecord(await announcement.file.data.get());

        // The bar's own text is an editable region; only the switch needs this.
        setToggled(".announcement-bar-text", on(data.enabled));
      })
    );
  } else {
    console.warn(`[siteChrome] ${ANNOUNCEMENT.path} is not editable here.`);
  }
}

let currentFileHandle: unknown;

function connectCurrentFile(api: CloudCannonJavaScriptV1API) {
  const file = api.currentFile();

  if (!file || file === currentFileHandle) return;
  currentFileHandle = file;

  const mine = generation;

  const repaint = framed(async () => {
    if (mine !== generation) return;

    const data = asRecord(await file.data.get());

    const title = text(data.title);
    const order = typeof data.order === "number" ? data.order : 0;

    pageData = data;

    applyToggles();
    setPageTitle(title);
    setPageGroup(text(data.group), title, order);
    setPageOrder(order);
  });

  file.addEventListener("change", repaint);
  repaint();
}

let started = false;

function start() {
  const api = window.CloudCannonAPI?.useVersion("v1", true);

  if (!api) return;

  if (!started) {
    started = true;
    connectDataFiles(api);
  }

  connectCurrentFile(api);
}

export function setupSiteChrome() {
  onPageLoad(() => {
    generation += 1;
    currentFileHandle = undefined;
    collapsedState.clear();

    if (window.CloudCannonAPI) start();
    else document.addEventListener("cloudcannon:load", start, { once: true });
  });
}
