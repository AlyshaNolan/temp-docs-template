import docsSite from "@data/docsSite.json";

/**
 * Links derived from `repositoryUrl` in `src/data/docsSite.json`.
 *
 * The field holds whatever URL an editor pasted, which is usually a browse URL
 * (`…/tree/main`). `/generate` and `/edit/` hang off the repository root, so the
 * branch suffix is stripped before anything is appended.
 */
const repositoryRoot = String(docsSite.repositoryUrl ?? "")
  .replace(/\/+$/, "")
  .replace(/\/tree\/[^/]+$/, "");

export const repositoryUrl = repositoryRoot;

/** GitHub's "Use this template" screen. Empty when no repository is configured. */
export const useTemplateUrl = repositoryRoot ? `${repositoryRoot}/generate` : "";

/** The repository's name, for prose that needs to say which repo. */
export const repositoryName = repositoryRoot.split("/").slice(-2).join("/");
