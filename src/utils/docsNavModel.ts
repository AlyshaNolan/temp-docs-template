/**
 * The two ordering rules the documentation sidebar obeys.
 *
 * Shared by the build-time derivation in `docsNav.ts` and the Visual Editor's
 * live patcher in `siteChrome.ts`. Both order the same sidebar, so a
 * divergence here shows as an edit landing in one position on canvas and a
 * different one after the rebuild.
 */

export type OrderedPage = { order: number; title: string };

/** Sidebar position: `order` frontmatter first, then title as the tiebreak. */
export function comparePages(a: OrderedPage, b: OrderedPage): number {
  return a.order - b.order || a.title.localeCompare(b.title);
}

/**
 * Group render order: the groups named in `docsSite.json`, in that order, then
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
