/**
 * The Markdown twin of every documentation page, at `/<slug>.md`.
 *
 * It backs the "Copy page" menu and stands on its own as the machine-readable
 * copy of the docs. A page at the site root is skipped: its slug is empty, so
 * the route would emit a file called `.md`.
 */
import { docsMarkdown } from "@utils/docsMarkdown";
import { docHref } from "@utils/docsNav";
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export async function getStaticPaths() {
  const docs = await getCollection("docs");

  return docs
    .map((doc: CollectionEntry<"docs">) => ({
      params: { slug: doc.id.replace(/\/?index$/, "") },
      props: { doc },
    }))
    .filter((path) => path.params.slug);
}

export const GET: APIRoute = ({ props, site }) => {
  const doc = props.doc as CollectionEntry<"docs">;
  const url = site ? new URL(docHref(doc.id), site).href : undefined;

  const markdown = docsMarkdown({
    title: doc.data.title,
    description: doc.data.description,
    body: doc.body,
    url,
  });

  // `text/plain` so a browser shows the file rather than downloading it. Only
  // the dev server honours this — a static host serves the built `.md` under
  // whatever type it maps the extension to.
  return new Response(markdown, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
