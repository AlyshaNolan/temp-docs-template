import docsSite from "@data/docsSite.json";

/**
 * The per-page "Edit this page" link, derived from `repositoryUrl` in
 * `src/data/docsSite.json` — the one place a fork edits.
 *
 * The field holds whatever URL an editor pasted, which is usually a browse URL
 * (`…/tree/main`). That suffix names the branch edit links target; the rest of
 * the URL is the repository root.
 */
const configured = String(docsSite.repositoryUrl ?? "").replace(/\/+$/, "");
const repositoryRoot = configured.replace(/\/tree\/[^/]+$/, "");
const branch = /\/tree\/([^/]+)$/.exec(configured)?.[1] ?? "main";

/** GitHub's editor for one source file, given its repository-relative path. */
export function editPageUrl(filePath?: string): string {
  return repositoryRoot && filePath ? `${repositoryRoot}/edit/${branch}/${filePath}` : "";
}
