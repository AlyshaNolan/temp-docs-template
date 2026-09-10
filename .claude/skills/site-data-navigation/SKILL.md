---
name: site-data-navigation
description: Use when editing the site header, sidebar grouping, footer, or SEO defaults — docsSite.json, footer.json, seo.json, announcementBar.json, breadcrumbs.json under src/data/ — or figuring out how those files reach the topbar, sidebar, footer and meta tags.
---

# Site data & navigation

Five JSON files under `src/data/` drive every page's chrome. They are plain data imported by layouts — not content collections — and CloudCannon edits them through its "Data" collection.

The one thing that is **not** in a data file is the documentation sidebar's contents: those come from page frontmatter. `docsSite.json` only orders the groups.

## When to use

- Changing the header: brand, version badge, search, theme toggle, top-level links.
- Ordering or collapsing sidebar groups.
- Adding a footer link or a social media link.
- Updating the site name, production URL, default description, or title template.
- Pointing the "Edit this page" link or the feedback endpoint somewhere else.

## When not to use

| Situation                                                          | Go instead to                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Adding a page to the sidebar                                       | [docs-content-authoring](../docs-content-authoring/SKILL.md) — it is `group` + `order` in frontmatter  |
| Changing how the header, sidebar, or footer _look_                 | [create-component](../create-component/SKILL.md) styling rules + [theming](../theming/SKILL.md) tokens |
| Composing a page-builder page, choosing which page sections to use | [page-content-authoring](../page-content-authoring/SKILL.md)                                           |
| Wiring new `data-prop` / editable bindings on a chrome component   | [editable-regions](../editable-regions/SKILL.md)                                                       |

## Data files overview

| File                            | Controls                                                                                        | Read by                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/data/docsSite.json`        | Brand, version badge, search, theme toggle, top links, sidebar group order, edit link, feedback | `src/layouts/Docs.astro` → `DocsTopbar.astro`; `src/utils/docsNav.ts`; `src/pages/[...slug].astro` |
| `src/data/footer.json`          | Footer legal text, links, socials                                                               | `src/layouts/Docs.astro` → `Footer.astro`                                                          |
| `src/data/seo.json`             | Site name/URL/description, default OG image, title template                                     | `src/layouts/BaseLayout.astro` → `SeoHead.astro` + `StructuredData.astro`                          |
| `src/data/announcementBar.json` | The dismissible bar above the header                                                            | `src/layouts/Docs.astro` → `AnnouncementBar.astro`                                                 |
| `src/data/breadcrumbs.json`     | Label for the leading crumb                                                                     | `Breadcrumbs.astro`                                                                                |

Editing the JSON file is what changes the rendered output — there is no other place these values come from.

---

## The header (`docsSite.json`)

```json
{
  "markLetter": "D",
  "wordmark": "Docsmith",
  "logoSource": "",
  "version": "v2.4",
  "themeToggle": true,
  "defaultTheme": "dark",
  "search": true,
  "topbarLinks": [{ "name": "GitHub", "path": "https://github.com/CloudCannon/docsmith" }],
  "navGroups": [{ "name": "Getting started", "collapsed": false }],
  "feedback": { "enabled": true, "action": "/" }
}
```

- **Brand.** `markLetter` + `wordmark` render an accent tile beside a word — no image asset to maintain, and it themes automatically. Set `logoSource` (plus `logoAlternateSource` for dark mode) to use an image instead; it replaces both.
- **`version`** is a label, not a switcher. It says which release these docs describe. Empty hides the badge.
- **`topbarLinks`** are flat — no dropdowns. They are hidden below 640px, so nothing essential should live only there.
- **`defaultTheme`** is `dark`, `light` or `system`. It is the scheme before a reader chooses one; `system` is the only value that consults the operating system. A reader's stored choice always wins. Hiding `themeToggle` doesn't change the resolution, only the control.

## Sidebar order (`navGroups`)

The sidebar's _contents_ are derived in `src/utils/docsNav.ts` from each page's `group` and `order` frontmatter. `navGroups` only decides the order the groups appear in, and whether a group renders collapsed.

**The coupling that nothing enforces:** a `navGroups` entry's `name` must match a page's `group` string exactly. A group named in frontmatter but missing from `navGroups` is appended after the listed ones rather than dropped — so a typo shows up as a group in the wrong place, not a missing one.

A page with no `group` still builds and is searchable; it just has no sidebar entry.

## The "Edit this page" link

`repositoryUrl` is the only URL to set. `src/utils/repository.ts` builds the link as `<repo>/edit/<branch>/<the page's file path>`, taking the branch from a `/tree/<branch>` suffix and defaulting to `main`:

```
"repositoryUrl": "https://github.com/acme/docs/tree/main"
```

Empty hides the link — and the "Use this template" and repository links with it. `editPageLabel` sets the link's text.

The date beside it is the page file's last commit, read at build time by `src/utils/gitDates.mjs`. There is no frontmatter field for it. A shallow clone has no per-file history, so the date is omitted rather than wrong.

## Feedback

`feedback.action` is where the helpful vote is posted. The default (`/`) posts to the site itself, which CloudCannon Forms captures with no extra setup. See the `/feedback-and-forms/` documentation page for the payload and the alternatives.

## Footer (`footer.json`)

`links` is a flat array of `{ name, path }`. `socials` entries need an `icon` that is a `social/<name>` id with a matching SVG in `src/icons/social/`, and a full profile URL as `link`.

## SEO (`seo.json`)

Set `name`, `url` (must match `site` in `astro.config.mjs`), `description`, `titleFormat` (include `{title}`). `npm run check:placeholders` warns while these hold the template's values.

---

## CloudCannon editing

- The `data` collection globs `src/data/**/*.json`, `disable_url: true`, `_enabled_editors: [data]`, grouped under "Data".
- `docsSite.json`, `announcementBar.json`, `breadcrumbs.json` and `seo.json` each have a schema in `.cloudcannon/schemas/`, matched by their `_schema` key, and per-field `comment:` text from `collections_config.data.schemas.<name>._inputs`.
- Array fields get their shape from **global structures matched by field name**, loaded by the root `_structures_from_glob`. `topbarLinks` and `footer.links` use `linkItems`, `socials` uses `socialItems` (both in `footerItems.cloudcannon.structures.yml`), and `navGroups` uses `docsNavGroups.cloudcannon.structures.yml`.
- Renaming a field in a data file means renaming it in the matching structure file too, or the editor shows the raw key.

## Verify your work

- `npm run check` — exit 0, no drift. `lint:schema` validates the data schemas against CloudCannon's own.
- `npm run dev`: confirm the header, sidebar order and footer reflect the change.
- If you edited `seo.json`, view source and confirm `<title>`, `og:*` and the `application/ld+json` script.
- In CloudCannon, open Data → Docs Site and confirm every field renders with a label. An unlabeled raw JSON field usually means a structure file's key no longer matches the data field name.
