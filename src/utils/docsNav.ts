/**
 * Build-time loader for the documentation nav: reads the `docs` collection and
 * hands it to the shared model in `docsNavModel.ts`, which is where the shape
 * is decided. The Visual Editor feeds that same model from CloudCannon's API,
 * so the derivation lives in one place and cannot drift.
 */
import sidebar from "@data/sidebar.json";
import { buildDocsNav, type DocsNav } from "@utils/docsNavModel";
import { getCollection } from "astro:content";

export {
  buildDocsNav,
  docHref,
  findCrumbs,
  findPager,
  type DocsNav,
  type DocsNavGroup,
  type DocsNavPage,
} from "@utils/docsNavModel";

export async function getDocsNav(): Promise<DocsNav> {
  const entries = await getCollection("docs");

  return buildDocsNav(
    entries.map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      group: entry.data.group,
      order: entry.data.order,
    })),
    { navGroups: sidebar.navGroups, homeLabel: sidebar.homeLabel }
  );
}
