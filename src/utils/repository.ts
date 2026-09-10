import docsSite from "@data/docsSite.json";

/**
 * Links derived from `repositoryUrl` in `src/data/docsSite.json` — the one
 * place a fork edits. Everything hanging off it ("Use this template", the
 * per-page edit link) is built here rather than configured a second time.
 *
 * The field holds whatever URL an editor pasted, which is usually a browse URL
 * (`…/tree/main`). That suffix names the branch edit links target; the rest of
 * the URL is the repository root.
 */
const configured = String(docsSite.repositoryUrl ?? "").replace(/\/+$/, "");
const repositoryRoot = configured.replace(/\/tree\/[^/]+$/, "");
const branch = /\/tree\/([^/]+)$/.exec(configured)?.[1] ?? "main";

export const repositoryUrl = repositoryRoot;

/** GitHub's "Use this template" screen. Empty when no repository is configured. */
export const useTemplateUrl = repositoryRoot ? `${repositoryRoot}/generate` : "";

/** The repository's name, for prose that needs to say which repo. */
export const repositoryName = repositoryRoot.split("/").slice(-2).join("/");

/** GitHub's editor for one source file, given its repository-relative path. */
export function editPageUrl(filePath?: string): string {
  return repositoryRoot && filePath ? `${repositoryRoot}/edit/${branch}/${filePath}` : "";
}
