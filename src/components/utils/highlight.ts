/**
 * Build-time syntax highlighting for code held in component props (code tabs,
 * annotated code) — Markdown fences are highlighted by Astro's own Shiki pass,
 * configured in `astro.config.mjs`. Both paths must use the same theme, or two
 * snippets on one page render in different palettes.
 *
 * The highlighter is created once per build: `createHighlighter` loads WASM and
 * grammar files, and paying that per component is seconds on a large site.
 */
import { createHighlighter, type Highlighter } from "shiki";
import { CODE_THEME } from "@utils/codeTheme.mjs";

export { CODE_THEME };

/** Languages a docs page can use. An unlisted one falls back to plain text. */
export const CODE_LANGUAGES = [
  "astro",
  "bash",
  "css",
  "diff",
  "html",
  "js",
  "json",
  "jsx",
  "markdown",
  "mdx",
  "python",
  "ruby",
  "sh",
  "ts",
  "tsx",
  "yaml",
] as const;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [CODE_THEME],
    langs: [...CODE_LANGUAGES],
  });

  return highlighterPromise;
}

export type DiffMarker = "add" | "remove" | "highlight";

export type HighlightOptions = {
  /** 1-based line numbers to mark with `data-highlighted`. */
  highlight?: number[];
  /** 1-based line number → marker number shown in the gutter. */
  annotations?: Map<number, number>;
  /** 1-based line number → `data-diff` value. */
  diff?: Map<number, DiffMarker>;
};

/** Returns the `<pre>` markup for `code`, or escaped plain text if `lang` is unknown. */
export async function highlightCode(
  code: string,
  lang: string,
  options: HighlightOptions = {}
): Promise<string> {
  const highlighter = await getHighlighter();
  const loaded = highlighter.getLoadedLanguages();
  const language = loaded.includes(lang) ? lang : "text";

  return highlighter.codeToHtml(code.replace(/\n+$/, ""), {
    lang: language,
    theme: CODE_THEME,
    transformers: [
      {
        line(node, line) {
          if (options.highlight?.includes(line)) {
            this.addClassToHast(node, "is-highlighted");
          }

          const marker = options.annotations?.get(line);

          if (marker !== undefined) {
            node.properties["data-annotation"] = String(marker);
          }

          const diff = options.diff?.get(line);

          if (diff !== undefined) {
            node.properties["data-diff"] = diff;
          }
        },
        pre(node) {
          // The theme's own background would win over the code token; the
          // palette is shared with Markdown fences via CSS, not inline styles.
          node.properties.style = undefined;
          this.addClassToHast(node, "code-pre");
        },
      },
    ],
  });
}

/** Parses `"1,3-5"` into `[1, 3, 4, 5]`. Whitespace and empty parts are ignored. */
export function parseLineRanges(input: string | undefined): number[] {
  if (!input) return [];

  const lines: number[] = [];

  for (const part of input.split(",")) {
    const [from, to] = part.trim().split("-").map(Number);

    if (!Number.isFinite(from)) continue;

    for (let line = from; line <= (Number.isFinite(to) ? to : from); line += 1) lines.push(line);
  }

  return lines;
}

const DIFF_PREFIXES: Record<string, DiffMarker> = {
  "+": "add",
  "-": "remove",
  "~": "highlight",
};

/**
 * Splits leading `+` / `-` / `~` markers off each line of `code`.
 *
 * The markers have to come off before the grammar runs — Shiki would otherwise
 * parse `+  search: {}` as broken source. A line of real code that starts with
 * one of those characters (a YAML list item, a leading unary minus) is eaten as
 * a marker, which is why only `CodeDiff` and `FileTree` run input through this.
 *
 * `preserveColumns` swaps the marker for a space instead of dropping it, so a
 * marked line stays aligned with its unmarked siblings — indentation is
 * meaningful in a file tree.
 */
export function parseDiffMarkers(
  code: string,
  { preserveColumns = false } = {}
): { lines: string[]; diff: Map<number, DiffMarker> } {
  const diff = new Map<number, DiffMarker>();
  const lines = code.split("\n").map((text, index) => {
    const marker = DIFF_PREFIXES[text[0] ?? ""];

    if (!marker) return text;

    diff.set(index + 1, marker);

    return (preserveColumns ? " " : "") + text.slice(1);
  });

  return { lines, diff };
}
