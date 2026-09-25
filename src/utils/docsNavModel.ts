/**
 * How the documentation sidebar is derived, with no dependency on how the pages
 * were loaded.
 *
 * `docsNav.ts` feeds this from `getCollection("docs")` at build time;
 * `siteChrome.ts` feeds it from `CloudCannon.collection()` in the Visual Editor,
 * where the answer includes edits that have not been built yet. One
 * implementation, two sources — a second copy would put a page in one place on
 * canvas and another after the rebuild.
 *
 * Two levels, from two different sources:
 *
 * - A page's `group` frontmatter (not its folder) puts it in a sidebar group.
 *   A page with no `group` builds and is searchable but never appears in the
 *   nav. Group order comes from `navGroups`; a group used in frontmatter but
 *   missing there is appended rather than dropped, so a new group is never
 *   silently invisible.
 * - A page's **path** nests it. `theming/token-reference.mdx` is a child of
 *   `theming.mdx` because that page exists, and inherits its group. Nesting is
 *   the file tree, so moving a page is the only thing that changes it — and a
 *   child whose parent page doesn't exist falls back to its own `group`.
 */

export type OrderedPage = { order: number; title: string };

/** Sidebar position: `order` frontmatter first, then title as the tiebreak. */
export function comparePages(a: OrderedPage, b: OrderedPage): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

/**
 * Group render order: the groups named in `sidebar.json`, in that order, then
 * any group named only in page frontmatter, alphabetically. Groups with no
 * pages drop out.
 *
 * Renaming a `navGroups` entry therefore renames nothing on screen — membership
 * comes from each page's `group`, so the old name survives in the alphabetical
 * tail instead.
 */
export function orderGroupNames(configured: string[], present: string[]): string[] {
  const extras = present.filter((name) => !configured.includes(name)).sort();

  return [...configured, ...extras].filter((name) => present.includes(name));
}

export type DocsNavPage = {
  id: string;
  title: string;
  description?: string;
  href: string;
  group?: string;
  /** Sidebar position within the group or parent. Always set — the schema defaults it to 0. */
  order: number;
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

/** One documentation page, as either loader reports it. */
export type DocsNavEntry = {
  id: string;
  title: string;
  description?: string;
  group?: string;
  order?: number;
};

export type DocsNavConfig = {
  navGroups?: { name: string; collapsed?: boolean }[];
  homeLabel?: string;
};

export function docHref(id: string): string {
  return `/${id.replace(/\/?index$/, "")}/`.replace(/\/{2,}/g, "/");
}

export function buildDocsNav(entries: DocsNavEntry[], config: DocsNavConfig = {}): DocsNav {
  const byId = new Map<string, DocsNavPage>(
    entries.map((entry) => [
      entry.id,
      {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        href: docHref(entry.id),
        group: entry.group,
        order: entry.order ?? 0,
        children: [],
      },
    ])
  );

  const sortPages = (pages: DocsNavPage[]) => pages.sort(comparePages);

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

  const configured = config.navGroups ?? [];
  const configuredNames = configured.map((group) => group.name);
  const byGroup = new Map<string, DocsNavPage[]>();

  for (const page of roots) {
    if (!page.group) continue;
    const bucket = byGroup.get(page.group) ?? [];

    bucket.push(page);
    byGroup.set(page.group, bucket);
  }

  for (const pages of byGroup.values()) sortPages(pages);

  const groups: DocsNavGroup[] = orderGroupNames(configuredNames, [...byGroup.keys()]).map(
    (name) => ({
      name,
      collapsed: configured.find((group) => group.name === name)?.collapsed ?? false,
      pages: byGroup.get(name) ?? [],
    })
  );

  const lead: DocsNavPage[] = [
    { id: "__home", title: config.homeLabel || "Overview", href: "/", order: 0, children: [] },
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
