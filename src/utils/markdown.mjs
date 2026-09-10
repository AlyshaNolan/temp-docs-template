/**
 * Markdown pipeline pieces shared by `astro.config.mjs`.
 *
 * Fence metadata is the contract with content authors: ```js title="a.js" {2,5}
 * sets the header label and highlights those lines. Both are also props on the
 * `CodeBlock` component, and the two paths must stay in step — a reader can't
 * tell which one produced a block.
 */
const RANGES = /\{([\d,\s-]+)\}/;
const TITLE = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/;

function parseRanges(input) {
  const lines = new Set();

  for (const part of input.split(",")) {
    const [from, to] = part.trim().split("-").map(Number);

    if (!Number.isFinite(from)) continue;

    for (let line = from; line <= (Number.isFinite(to) ? to : from); line += 1) lines.add(line);
  }

  return lines;
}

/** Shiki transformer marking the lines named by `{1,3-5}` in the fence meta. */
export function fenceMetaTransformer() {
  return {
    name: "docs-fence-highlight",
    pre(node) {
      // Shiki writes the theme's background and foreground as an inline style,
      // which no stylesheet can override — including the print rules, so a
      // fence would print dark. The palette comes from `--color-code-*`.
      node.properties.style = undefined;

      // `_prose.css` reads the header label off `data-title`, falling back to
      // the language. Nothing upstream sets it, so the fence's own `title=`
      // has to be lifted here or every header reads "bash".
      const title = (this.options.meta?.__raw ?? "").match(TITLE);

      if (title) node.properties["data-title"] = title[1] ?? title[2] ?? title[3];
    },
    line(node, line) {
      const meta = this.options.meta?.__raw ?? "";
      const ranges = meta.match(RANGES);

      if (ranges && parseRanges(ranges[1]).has(line)) this.addClassToHast(node, "is-highlighted");
    },
  };
}
