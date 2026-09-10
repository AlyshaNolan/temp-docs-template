import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

const contentBlockSchema = z.object({ _component: z.string() }).passthrough();

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),
  canonical: z.string().optional(),
  noindex: z.boolean().optional(),
  pageSections: z.array(contentBlockSchema),
});

// A documentation page. `group` and `order` place it in the sidebar; both are
// optional, and a page with neither still builds and is searchable — it just
// doesn't appear in the nav. See `src/utils/docsNav.ts`. There is no `updated`
// field: the meta line's date is the file's last commit (`src/utils/gitDates.mjs`).
const docSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  group: z.string().optional(),
  order: z.number().default(0),
  keywords: z.array(z.string()).optional(),
  image: z.string().optional(),
  noindex: z.boolean().optional(),
  showToc: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  showCopyPage: z.boolean().default(true),
  showPager: z.boolean().default(true),
});

// One release per file. Nothing routes this collection — it has no URL of its
// own; the `changelog` component reads it into the changelog page.
const changelogSchema = z.object({
  version: z.string(),
  date: z.coerce.date(),
  summary: z.string().optional(),
  changes: z
    .array(
      z.object({
        tag: z.string().optional(),
        text: z.string(),
      })
    )
    .default([]),
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: pageSchema,
});

const docsCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/docs" }),
  schema: docSchema,
});

const changelogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
  schema: changelogSchema,
});

export const collections = {
  pages: pagesCollection,
  docs: docsCollection,
  changelog: changelogCollection,
};
