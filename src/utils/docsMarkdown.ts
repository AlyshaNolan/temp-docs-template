/**
 * The Markdown behind "Copy page": what `/<slug>.md` serves and what the menu
 * puts on the clipboard.
 *
 * It is the page's own MDX source with a title header prepended, not a
 * rendering of it — component tags such as `<Alert … />` survive verbatim.
 * That keeps the two in step: a transform would have to know every component,
 * and the one it didn't know would silently ship a shorter page than the
 * reader sees.
 */
const MODULE_LINE = /^\s*(?:import|export)\s/;

/** The `.md` twin of a docs page href: `/guides/setup/` → `/guides/setup.md`. */
export function markdownHref(href: string): string {
  return `${href.replace(/\/+$/, "")}.md`;
}

/**
 * Drops the `import`/`export` block MDX allows above the content. Only the
 * leading run is taken, so an `import` shown inside a code fence survives.
 */
function stripModuleHeader(body: string): string {
  const lines = body.split("\n");
  let start = 0;

  while (start < lines.length && (lines[start].trim() === "" || MODULE_LINE.test(lines[start]))) {
    start += 1;
  }

  return lines.slice(start).join("\n");
}

export type DocsMarkdownInput = {
  title: string;
  description?: string;
  body?: string;
  url?: string;
};

/** A standalone Markdown document for one docs page. */
export function docsMarkdown({ title, description, body = "", url }: DocsMarkdownInput): string {
  const parts = [`# ${title}`];

  if (description) parts.push(description);
  if (url) parts.push(`Source: ${url}`);

  const content = stripModuleHeader(body).trimEnd();

  if (content) parts.push("---", content);

  return `${parts.join("\n\n")}\n`;
}

/** The page Markdown wrapped in the context an LLM needs to answer about it. */
export function llmPrompt(markdown: string, url: string): string {
  return [
    "Read the documentation page below, then answer my questions about it.",
    `Source: ${url}`,
    "---",
    markdown.trimEnd(),
  ].join("\n\n");
}
