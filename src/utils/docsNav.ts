/**
 * The sidebar, the prev/next pager and the breadcrumbs are all one ordered
 * reading order derived here — change the shape in one place or they drift.
 *
 * Two levels, from two different sources:
 *
 * - A page's `group` frontmatter (not its folder) puts it in a sidebar group.
 *   A page with no `group` builds and is searchable but never appears in the
 *   nav. Group order comes from `src/data/docsSite.json`; a group used in
 *   frontmatter but missing there is appended rather than dropped, so a new
 *   group is never silently invisible.
 * - A page's **path** nests it. `theming/token-reference.mdx` is a child of
 *   `theming.mdx` because that page exists, and inherits its group. Nesting is
 *   the file tree, so moving a page is the only thing that changes it — and a
 *   child whose parent page doesn't exist falls back to its own `group`.
 */
import docsSite from "@data/docsSite.json";
import { getCollection, type CollectionEntry } from "astro:content";

export type DocsNavPage = {
  id: string;
  title: string;
  description?: string;
  href: string;
  group?: string;
  children: DocsNavPage[];
};

export type DocsNavGroup = {
  name: string;
  collapsed: boolean;
  pages: DocsNavPage[];
};

export type DocsNav = {
  /** Standalone links above the first group — the site home, by convention. */
  lead: DocsNavPage[];
  groups: DocsNavGroup[];
  /** Sidebar order, flattened depth-first. The pager walks this. */
  reading: DocsNavPage[];
  /** Every page by href, for breadcrumbs and parent lookups. */
  byHref: Map<string, { page: DocsNavPage; parent?: DocsNavPage; group?: string }>;
};

export function docHref(id: string): string {
  return `/${id.replace(/\/?index$/, "")}/`.replace(/\/{2,}/g, "/");
}

function toNavPage(entry: CollectionEntry<"docs">): DocsNavPage {
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    href: docHref(entry.id),
    group: entry.data.group,
    children: [],
  };
}

export async function getDocsNav(): Promise<DocsNav> {
  const entries = await getCollection("docs");
  const order = new Map(entries.map((entry) => [entry.id, entry.data.order]));
  const byId = new Map(entries.map((entry) => [entry.id, toNavPage(entry)]));

  const sortPages = (pages: DocsNavPage[]) =>
    pages.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) || a.title.localeCompare(b.title)
    );

  // Nest before grouping: a child's group is its parent's, whatever its own
  // frontmatter says, so the two levels can't disagree in the sidebar.
  const roots: DocsNavPage[] = [];

  for (const page of byId.values()) {
    const parentId = page.id.includes("/") ? page.id.slice(0, page.id.lastIndexOf("/")) : null;
    const parent = parentId ? byId.get(parentId) : undefined;

    if (parent) {
      parent.children.push(page);
      page.group = parent.group;
    } else {
      roots.push(page);
    }
  }

  for (const page of byId.values()) sortPages(page.children);

  const configured = docsSite.navGroups ?? [];
  const configuredNames = configured.map((group) => group.name);
  const byGroup = new Map<string, DocsNavPage[]>();

  for (const page of roots) {
    if (!page.group) continue;
    const bucket = byGroup.get(page.group) ?? [];

    bucket.push(page);
    byGroup.set(page.group, bucket);
  }

  for (const pages of byGroup.values()) sortPages(pages);

  const extras = [...byGroup.keys()].filter((name) => !configuredNames.includes(name)).sort();

  const groups: DocsNavGroup[] = [...configuredNames, ...extras]
    .filter((name) => byGroup.has(name))
    .map((name) => ({
      name,
      collapsed: configured.find((group) => group.name === name)?.collapsed ?? false,
      pages: byGroup.get(name) ?? [],
    }));

  const lead: DocsNavPage[] = [
    { id: "__home", title: docsSite.homeLabel || "Overview", href: "/", children: [] },
  ];

  const reading: DocsNavPage[] = [...lead];
  const byHref: DocsNav["byHref"] = new Map(
    lead.map((page) => [page.href, { page, group: undefined }])
  );

  for (const group of groups) {
    for (const page of group.pages) {
      reading.push(page);
      byHref.set(page.href, { page, group: group.name });

      for (const child of page.children) {
        reading.push(child);
        byHref.set(child.href, { page: child, parent: page, group: group.name });
      }
    }
  }

  return { lead, groups, reading, byHref };
}

export function findPager(nav: DocsNav, href: string) {
  const index = nav.reading.findIndex((page) => page.href === href);

  if (index === -1) return { prev: undefined, next: undefined };

  return {
    prev: index > 0 ? nav.reading[index - 1] : undefined,
    next: index < nav.reading.length - 1 ? nav.reading[index + 1] : undefined,
  };
}

/** The trail after the leading crumb: the group, then any parent page. */
export function findCrumbs(nav: DocsNav, href: string): { label: string; url?: string }[] {
  const entry = nav.byHref.get(href);

  if (!entry) return [];

  return [
    ...(entry.group ? [{ label: entry.group }] : []),
    ...(entry.parent ? [{ label: entry.parent.title, url: entry.parent.href }] : []),
    { label: entry.page.title },
  ];
}
