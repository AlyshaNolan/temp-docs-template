/**
 * The drawer's checkbox lives in `DocsSidebar`; its `<label for>` trigger lives
 * in `DocsTopbar`. Both import this id — a literal in either file would drift.
 */
export const DOCS_NAV_TOGGLE_ID = "docs-nav-toggle";
