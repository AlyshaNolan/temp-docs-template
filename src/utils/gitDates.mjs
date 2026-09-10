import { execFileSync } from "node:child_process";

/**
 * Last commit date per repository-relative file path, for the "Updated" line on
 * documentation pages.
 *
 * Reads the whole history for `src/content` in one `git log`, newest first, so
 * the first date a path appears under is its last modification.
 *
 * Silent failure mode: a shallow clone or an export with no `.git` yields no
 * dates at all, and callers show no "Updated" line rather than stamping every
 * page with the build date. Fetch full history in CI if the line matters.
 */
const CONTENT_DIR = "src/content";

let dates = null;

function run(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function load() {
  const map = new Map();

  let prefix = "";
  let log = "";

  try {
    // git reports paths from the repository root; `entry.filePath` is relative
    // to the Astro project, which is a subdirectory in a monorepo.
    prefix = run(["rev-parse", "--show-prefix"]).trim();
    log = run([
      "-c",
      "core.quotepath=false",
      "log",
      "--pretty=format:%x00%cI",
      "--name-only",
      "--diff-filter=ACMRT",
      "--",
      CONTENT_DIR,
    ]);
  } catch {
    return map;
  }

  for (const commit of log.split("\0")) {
    const [iso, ...paths] = commit.split("\n");

    if (!iso) continue;

    for (const path of paths) {
      if (!path) continue;

      const relative = prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;

      if (!map.has(relative)) map.set(relative, iso);
    }
  }

  return map;
}

/** The file's last commit date, or null when git cannot answer. */
export function gitLastModified(filePath) {
  dates ??= load();

  const iso = filePath ? dates.get(filePath) : undefined;

  return iso ? new Date(iso) : null;
}
