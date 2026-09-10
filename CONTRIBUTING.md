# Contributing

Read [`CLAUDE.md`](CLAUDE.md) (commands, conventions that bite), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (how the machinery fits together), and [`AGENTS.md`](AGENTS.md) (skills index) before changing anything structural. This file covers the contribution mechanics they don't.

## Adding a component

The canonical playbook is the [create-component skill](.agents/skills/create-component/SKILL.md) — follow it, not this summary. The shape of the work:

1. Pick the tier (core element / wrapper / page section) and create a kebab-case directory under `src/components/` with a matching `PascalCase.astro`. Discovery is by glob — no manual registry.
2. Write the sibling CloudCannon YAML: `{slug}.cloudcannon.structure-value.yml` (label, icon, defaults for every prop) and `{slug}.cloudcannon.inputs.yml`. Wrappers additionally need registering in `.cloudcannon/structures/*.yml` contexts.
3. Style with `<style is:global>` in `@layer components` (building blocks) or `@layer page-sections` (page sections), tokens only — no hardcoded colors/spacing/breakpoints.
4. Interactive JS that must work in the CloudCannon editor goes in an importable module registered in `editor-live-sync.js` — inline `<script>`s don't run there.
5. Insertable in a documentation page's body? Add `{slug}.cloudcannon.snippets.yml`, and check the tag name matches its key in `src/components/utils/mdxComponents.ts`.
6. Author a `*.preview.mjs` recipe, then `npm run previews:build` to compile its thumbnail SVG.
7. `npm run docs:catalog` to refresh the agent-facing component tables.
8. Place it on a page under `src/content/` so it ships composed — and so the smoke tests can reach it.
9. `npm run check`, then verify in the Visual Editor (`npm run dev`).

## The check gauntlet

Run `npm run check` before claiming any work done. It chains:

- `lint` — ESLint on JS/TS/Astro, ESLint on YAML, Stylelint on CSS.
- `format` — Prettier check across the repo (`format:fix` / `check:fix` to auto-fix).
- `typecheck` — `astro check` (TypeScript across `.astro` files).
- `previews:check` — fails if a component is missing its `*.preview.mjs` recipe or built SVG (or an SVG is orphaned / `image:` unwired / a committed SVG is stale vs. its recipe); browser-free.
- `agents:check` — fails if `.claude/skills/` or `.cursor/rules/` drift from canonical `.agents/`.
- `docs:catalog:check` — fails if the component tables in the page-content-authoring skill are stale.
- `lint:cms` — validates the CloudCannon layer against the components: prop drift, orphaned/missing YAML, `_component` resolution.
- `lint:roots` / `lint:nesting` / `lint:schema` — editor-root attributes, the picker's nesting policy, and the official CloudCannon JSON Schemas.
- `lint:links` — every internal link in the built site resolves.

## Dependencies: never bare `npm install`

After editing `package.json`, run `npm run deps:sync` — never plain `npm install`. A macOS install strips the Linux-only optional dependencies (sharp and rollup native binaries) from the lockfile, which breaks CI. `deps:sync` regenerates the lockfile with those platforms pinned, then runs `npm ci`. `package.json` is JSON and can't carry a comment saying this — that's why it lives here.

## Changelog

User-facing changes (features, fixes, behavior changes) get an entry in the `[Unreleased]` section of `CHANGELOG.md`, [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Append to an existing `### Added`/`### Changed`/etc. heading — never duplicate one. Skip internal-only refactors. Full rule: [`.agents/rules/changelog.md`](.agents/rules/changelog.md).

## Skills layout

Agent skills and rules live canonically in `.agents/` (`skills/<skill>/SKILL.md`, `rules/<name>.md`). `.claude/skills/` and `.cursor/rules/` are generated copies — never hand-edit them. Edit under `.agents/`, then run `npm run agents:sync`; `agents:check` fails CI on drift.
