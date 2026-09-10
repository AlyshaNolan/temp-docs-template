---
name: docs-content-authoring
description: Use when writing or editing a documentation page — frontmatter, sidebar placement, callouts, code blocks and tabs, annotated code, tables, definition lists, diagrams, figures, API parameter lists, or changelog releases. Start here for "add a docs page" or "how do I put X in a docs page".
---

# Writing a documentation page

A documentation page is one `.mdx` file under `src/content/docs/`. Its file path is its URL, its frontmatter places it in the sidebar, and its body is Markdown plus a small set of components exposed to MDX.

## When to use

- Adding or editing a page under `src/content/docs/`.
- Putting a callout, code sample, diagram, figure or parameter list into prose.
- Adding a release to the changelog.
- Working out why a page isn't in the sidebar.

## When not to use

| Situation                                                  | Go instead to                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Building the overview / a landing page from page sections  | [page-content-authoring](../page-content-authoring/SKILL.md) |
| Ordering sidebar groups, header, footer, SEO               | [site-data-navigation](../site-data-navigation/SKILL.md)     |
| Adding a new component to the library                      | [create-component](../create-component/SKILL.md)             |
| A page renders blank, or a component is missing in the CMS | [debug-cloudcannon](../debug-cloudcannon/SKILL.md)           |

## The file

```
src/content/docs/installation.mdx             →  /installation/
src/content/docs/theming.mdx                  →  /theming/
src/content/docs/theming/token-reference.mdx  →  /theming/token-reference/
```

The path is the URL, and it is also what **nests** a page: `theming/token-reference.mdx` is a
child of `theming.mdx` in the sidebar because that page exists. A child inherits its parent's
`group`, so the two levels can't disagree — and moving the file is the only thing that changes
the nesting.

A folder with no page at its own path nests nothing; its pages are grouped by `group` like any
other. Two levels is the practical limit for a sidebar — past that a reader can't see where
they are — so `docsNav.ts` builds two and no more.

## Frontmatter

Validated by `docSchema` in `src/content.config.ts`; an unknown key is a build error.

| Key            | Type     | Default | Effect                                                                      |
| -------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `title`        | string   | —       | Required. Page heading, browser title, sidebar label, search result.        |
| `description`  | string   | —       | The lede under the title, and the meta description.                         |
| `group`        | string   | —       | Sidebar group. **No group means no sidebar entry** — the page still builds. |
| `order`        | number   | `0`     | Position within the group. Ties break alphabetically by title.              |
| `updated`      | date     | —       | Shown in the meta line. Omit and the line hides.                            |
| `keywords`     | string[] | —       | Meta keywords.                                                              |
| `image`        | string   | —       | Social share image.                                                         |
| `noindex`      | boolean  | `false` | Keeps the page out of search engines.                                       |
| `showToc`      | boolean  | `true`  | The on-this-page rail, built from the page's `h2`/`h3`.                     |
| `showFeedback` | boolean  | `true`  | The helpful vote at the foot of the page.                                   |
| `showPager`    | boolean  | `true`  | Previous/next links across the sidebar's reading order.                     |

`group` must match a `navGroups` entry in `src/data/docsSite.json` to be ordered deliberately; an unlisted group is appended rather than dropped.

## Body: plain Markdown

Headings, lists, tables, blockquotes, links and inline code all work and are styled by `src/styles/base/_prose.css`. That file owns the page rhythm, and it is three numbers: **8px** under a heading, **24px** around a block (callout, code, diagram, table, figure, parameter list), **44px** before the next heading. Nothing in content should need to adjust it — if a page looks wrong, the rule is wrong. Use `h2` for sections and `h3` beneath — those are what the on-this-page rail lists, and each gets a copyable `#` anchor on hover.

Link internally by URL: `[Configuration](/configuration/)`. `npm run lint:links` fails the build on an internal link that resolves to no page, so a renamed page can't quietly rot.

### Code fences

A fence takes a filename and line highlights in its meta string:

````md
```js title="docsmith.config.js" {2,5-7}

```
````

`title=` becomes the header label (Astro handles it), and `{2,5-7}` marks those lines (`fenceMetaTransformer` in `src/utils/markdown.mjs`). Untitled fences label themselves with the language. A copy button is added by script — see `code-block/setup.ts` for why it isn't in the HTML.

## Body: components

These are available in any `.mdx` page with no import, and each has a CloudCannon snippet so an editor can insert it from the Content Editor's `+` menu. The component name is the key in `src/components/utils/mdxComponents.ts` — renaming a component's file renames the tag.

| Tag               | For                                                                   | Key props                                                           |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Alert`           | A callout: note, tip, warning, danger                                 | `variant`, `title`, `text` (markdown)                               |
| `CodeBlock`       | A code sample from a prop rather than a fence                         | `code`, `language`, `filename`, `highlight`                         |
| `CodeTabs`        | One sample in several languages, choice remembered site-wide          | `tabs[]` of `{ label, language, code, highlight }`, `filename`      |
| `CodeAnnotations` | Code with numbered notes underneath                                   | `code`, `language`, `filename`, `notes[]` of `{ line, text }`       |
| `CodeDiff`        | A sample with changed lines marked, still highlighted in its language | `code` (lines prefixed `+`/`-`/`~`), `language`, `filename`         |
| `FileTree`        | A directory tree drawn from an indented list of paths                 | `paths`, `title`                                                    |
| `ParamList`       | API reference entries where descriptions run long                     | `params[]` of `{ name, type, required, defaultValue, description }` |
| `DefinitionList`  | Glossaries and field terminology                                      | `items[]` of `{ title, text }`, `layout` (`stacked`/`grid`)         |
| `Diagram`         | A Mermaid diagram                                                     | `definition`, `caption`                                             |
| `Figure`          | A captioned screenshot with a dark variant and click-to-zoom          | `source`, `alternateSource`, `alt`, `caption`, `zoom`               |
| `Changelog`       | Every release in the changelog collection, newest first               | `limit`                                                             |
| `Accordion`       | Optional depth in a disclosure                                        | `items[]` of `{ title, contentSections[] }`                         |
| `Form`            | Any form. Posts to the site by default, which CloudCannon captures    | `action`, `formBlocks[]`                                            |
| `Video`           | A local file or an embed id                                           | `source`, `title`                                                   |
| `Embed`           | Raw HTML in a fixed aspect ratio — a sandbox, a map, another service  | children (the HTML), `aspectRatio`                                  |
| `Badge`           | A status pill: Beta, Deprecated, a version marker                     | `text`, `variant`, `iconName`, `showDot`, `link`                    |
| `Steps`           | A numbered walkthrough                                                | `items[]` of `{ contentSections[] }`, `orientation`, `heading`      |
| `FaqSection`      | Questions and answers in an accordion                                 | `items[]` of `{ title, contentSections[] }`, `heading`              |

`Steps` and `FaqSection` are page sections, so they carry section chrome: in a page body set `maxContentWidth`, `paddingHorizontal` and `paddingVertical` to `none`, write the section's heading as a Markdown `##` (which the on-this-page rail reads) and pass `heading=""` so it isn't printed twice. `/introduction/` and `/installation/` do this.

Every building block in the library can be used the same way — the table lists the ones a documentation page usually reaches for. The full catalog is in [page-content-authoring/component-catalog.md](../page-content-authoring/component-catalog.md).

### Writing a component into prose

```mdx
<Alert
  variant="warning"
  title="Rotating a key revokes the old one"
  text="Existing clients fail on the next request. Deploy the new key before rotating."
/>
```

**MDX quoting bites here.** A prop value in double quotes cannot contain a double quote — the parser reads it as the end of the attribute and then fails on the next character. Use a template literal for multi-line code (``code={`…`}``) and avoid quoted words inside prop text.

**Multi-line code goes in an `export const`, not inline.** MDX strips up to two leading spaces from every continuation line of a JSX attribute, so a template literal written inline silently loses one indent level — the page builds and the sample just renders wrong. An ESM block above the prose is not touched:

```mdx
export const sample = `export default {
  search: { provider: 'local' },
}`;

<CodeBlock language="js" code={sample} />
```

This bites hardest on `FileTree` and `CodeDiff`, where the indentation _is_ the content: two lost spaces re-parent a whole subtree.

## Changelog releases

A release is **not** written into `changelog.mdx`. Each one is its own file in
`src/content/changelog/`, and `<Changelog />` on the page renders the whole
collection, newest `date` first:

```yaml
# src/content/changelog/2.5.0.md
---
version: 2.5.0
date: 2026-09-10
changes:
  - tag: Added
    text: What shipped, in one line. Markdown works here.
  - tag: Breaking
    text: '`oldThing` is replaced by `newThing`.'
---
```

`tag` comes from the `changelogChanges` structure — Added, Changed, Deprecated,
Removed, Fixed, Security, Breaking. Breaking and Added are colour-coded; the
rest render neutral. The file has no body and no URL of its own; the version is
an anchor on the changelog page.

`<Changelog limit={3} />` renders only the most recent three, for a release-notes
teaser on another page.

## Choosing between a fence, `CodeBlock` and `CodeTabs`

| You have                                      | Use               |
| --------------------------------------------- | ----------------- |
| One sample, written by a developer in Git     | a fence           |
| One sample an editor should change in the CMS | `CodeBlock`       |
| The same sample in several languages          | `CodeTabs`        |
| Lines that need explaining                    | `CodeAnnotations` |
| Before/after of the same file                 | `CodeDiff`        |
| A directory layout                            | `FileTree`        |

A fence is the lightest and reads best in a diff. `CodeBlock` exists because a fence is not an editable field in CloudCannon — its `code` prop is.

## Diagrams

`Diagram` renders Mermaid in the browser: the source ships in the page inside a `<pre>` and the SVG replaces it once the library loads, which happens only on pages that contain one. Consequences worth knowing:

- With JavaScript off, and in a printout, the reader gets the source rather than an empty box.
- The source is what the search index holds, not the rendered labels.
- A diagram that won't parse leaves the source visible instead of failing the build.

## Verify your work

- `npm run dev` and read the page. Check the sidebar entry, the on-this-page rail, and prev/next.
- `npm run check` — `lint:links` catches a dead internal link, `lint:cms` catches snippet drift.
- In CloudCannon's Content Editor, confirm each component you used appears in the `+` menu and round-trips: insert it, save, and check the MDX still parses.
