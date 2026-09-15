/**
 * Writes `_cloudcannon/routing.json` into the build output, merging the
 * editor's redirects from `src/data/redirects.json` ahead of the rules in
 * `.cloudcannon/routing.json`.
 *
 * CloudCannon reads the built file in preference to the source one, so this is
 * what lets an editor add a redirect without touching the repository. It can't
 * be an Astro route: `src/pages/_cloudcannon/` starts with an underscore, which
 * Astro treats as private and never emits.
 *
 * Rules are matched in order and the source file ends with a catch-all that
 * serves the 404 page, so editor routes have to come first. Headers are not
 * editable — nothing in the CMS should be able to drop a security header.
 *
 *   node scripts/cms/routing.mjs [--out dist]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname), "..", "..");

const args = process.argv.slice(2);
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : "dist";

const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

const base = readJson(".cloudcannon/routing.json");
const { routes = [] } = readJson("src/data/redirects.json");

// A half-filled row is a redirect an editor started and abandoned. Emitting it
// would send readers to `undefined`; dropping it leaves the 404 page to do its
// job, which is the safer of the two.
const editorRoutes = routes
  .filter((route) => route?.from?.trim() && route?.to?.trim())
  .map((route) => ({
    from: route.from.trim(),
    to: route.to.trim(),
    status: Number(route.status) || 301,
  }));

const routing = { ...base, routes: [...editorRoutes, ...(base.routes ?? [])] };

const target = join(root, outDir, "_cloudcannon", "routing.json");

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(routing, null, 2)}\n`);

console.log(
  `ok     ${outDir}/_cloudcannon/routing.json written — ` +
    `${editorRoutes.length} editor redirect(s) ahead of ${base.routes?.length ?? 0} source rule(s).`
);
