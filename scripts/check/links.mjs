/**
 * Every internal link in the built site must resolve to a page.
 *
 *   node scripts/check/links.mjs
 *
 * A renamed documentation page leaves dead links behind and nothing errors —
 * the page still builds, the link still looks like a link. This walks `dist/`
 * (building it first when it is missing or stale) and fails on any local href
 * with no corresponding file.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { glob } from "glob";

const root = join(import.meta.dirname, "..", "..");
const dist = join(root, "dist");

// Inputs whose edits change the built HTML, so a build older than any of them
// can't be trusted for this check.
const SOURCES = ["src", "public", "astro.config.mjs", "site-fonts.mjs"];

async function newestMtime(target) {
  const absolute = join(root, target);

  if (!existsSync(absolute)) return 0;

  const files = statSync(absolute).isDirectory()
    ? await glob("**/*", { cwd: absolute, nodir: true, absolute: true, dot: true })
    : [absolute];

  let newest = 0;

  for (const file of files) {
    const { mtimeMs } = statSync(file);

    if (mtimeMs > newest) newest = mtimeMs;
  }
  return newest;
}

/**
 * A stale `dist/` passes a check it should fail — the build predates the edit
 * that broke the link, so the dead href simply isn't in the HTML being read.
 */
async function staleReason() {
  if (!existsSync(dist)) return "dist/ not found";

  const built = await newestMtime("dist");
  const edited = Math.max(...(await Promise.all(SOURCES.map(newestMtime))));

  return edited > built ? "dist/ is older than the last source edit" : null;
}

const reason = await staleReason();

if (reason) {
  console.log(`${reason} — building the site first.`);
  execSync("npx astro build", { cwd: root, stdio: "inherit" });
}

/**
 * `/preview-renders/*` only exists in a `COMPONENT_PREVIEWS=true` build. Those
 * pages render a component from its defaults, so a nav component synthesises a
 * trail from a URL that is not a real route — checking them reports links the
 * site never ships.
 */
const HARNESS = "preview-renders/";

const pages = (await glob("**/*.html", { cwd: dist })).filter((page) => !page.startsWith(HARNESS));
const known = new Set();

for (const page of pages) {
  const url = `/${page.replace(/index\.html$/, "").replace(/\.html$/, "")}`;

  known.add(url.endsWith("/") ? url : `${url}/`);
  known.add(url);
}

// Non-HTML assets the site ships (favicon, previews, uploads, the search index).
for (const asset of await glob("**/*", { cwd: dist, nodir: true })) known.add(`/${asset}`);

const HREF = /\shref="([^"]+)"/g;
const failures = [];

for (const page of pages) {
  const html = readFileSync(join(dist, page), "utf8");
  const from = `/${page.replace(/index\.html$/, "")}`;

  for (const [, href] of html.matchAll(HREF)) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;

    const path = href.split(/[?#]/)[0];

    if (!path || path === "/") continue;
    if (known.has(path) || known.has(`${path}/`)) continue;

    failures.push({ from, href });
  }
}

if (failures.length) {
  for (const { from, href } of failures) {
    console.error(`FAIL   ${from} links to ${href}, which no page or asset provides`);
  }
  console.error(`\n${failures.length} dead internal link(s).`);
  process.exit(1);
}

console.log(`ok     every internal link resolves — ${pages.length} page(s) checked.`);
