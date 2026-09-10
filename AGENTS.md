# AGENTS.md

Astro documentation starter: a complete docs site — search, reference pages, diagrams, media, print layout — visually editable in CloudCannon.

## Agent docs

Everything agent-facing is canonical under `.agents/`; each tool's own directory is generated from it:

| Canonical                 | Generated for                       | Read directly by                            |
| ------------------------- | ----------------------------------- | ------------------------------------------- |
| `.agents/skills/<skill>/` | `.claude/skills/` (Claude Code)     | Cursor                                      |
| `.agents/rules/<name>.md` | `.cursor/rules/<name>.mdc` (Cursor) | Claude Code, via `@` imports in `CLAUDE.md` |

**Never hand-edit a generated directory.** Edit under `.agents/`, then run:

```
npm run agents:sync
```

`npm run agents:check` (part of `npm run check`) fails CI on drift.

### Available skills

- **adding-fonts** — Add or change fonts using local `@fontsource` packages.
- **create-component** — Scaffold new components for the Astro + CloudCannon component library.
- **debug-cloudcannon** — Troubleshoot CloudCannon visual editing issues (picker, editable regions, renderBlock).
- **docs-content-authoring** — Write a documentation page: frontmatter, sidebar placement, and the components MDX exposes.
- **editable-regions** — Deep reference for wiring `data-prop` / `data-children-prop` visual-editing bindings.
- **migrate-existing-site** — End-to-end workflow for migrating an existing website into this component starter.
- **page-content-authoring** — Assemble a landing page from existing components via `pageSections` YAML; owns the component catalog.
- **screenshot-to-component** — Build a new page section component from a screenshot.
- **site-data-navigation** — Configure the header, sidebar group order, footer, and SEO data.
- **theming** — Customize colors, fonts, spacing, and other design tokens for brand matching.

### Companion plugin

The [CloudCannon/agent-skills](https://github.com/CloudCannon/agent-skills) plugin provides generic CloudCannon migration/config skills (not specific to this repo's component architecture). It's an optional companion, not a replacement for the skills above.

## More context

- `CLAUDE.md` — commands, conventions that bite, and detailed workflow guide index.
- `docs/ARCHITECTURE.md` — structural overview; read before structural changes.
