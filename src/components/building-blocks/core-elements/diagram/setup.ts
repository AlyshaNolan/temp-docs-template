/**
 * Renders Mermaid source into SVG in the browser.
 *
 * Mermaid needs a DOM to lay a diagram out, so there is no build-time render
 * without shipping a headless browser in the build. Instead the source stays in
 * the HTML inside a `<pre>` — searchable, printable, and readable with no JS —
 * and the SVG replaces it once Mermaid loads. The import is dynamic, so the
 * library (which is large) is fetched only on pages that contain a diagram.
 */
let mermaidPromise: Promise<typeof import("mermaid").default> | undefined;
let themeWatcherBound = false;

function loadMermaid() {
  mermaidPromise ??= import("mermaid").then((module) => module.default);

  return mermaidPromise;
}

/**
 * Mermaid has its own palette, so it is handed the site's tokens instead —
 * otherwise the one element on the page that ignores the theme is the diagram.
 */
function themeVariables(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();

  return {
    background: token("--color-bg-surface"),
    primaryColor: token("--color-bg"),
    primaryTextColor: token("--color-text"),
    primaryBorderColor: token("--color-border-strong"),
    secondaryColor: token("--color-bg-muted"),
    secondaryTextColor: token("--color-text"),
    secondaryBorderColor: token("--color-border-strong"),
    tertiaryColor: token("--color-bg-muted"),
    tertiaryTextColor: token("--color-text"),
    tertiaryBorderColor: token("--color-border-strong"),
    lineColor: token("--color-accent"),
    textColor: token("--color-text"),
    mainBkg: token("--color-bg"),
    nodeBorder: token("--color-border-strong"),
    clusterBkg: token("--color-bg-surface"),
    clusterBorder: token("--color-border"),
    edgeLabelBackground: token("--color-bg-surface"),
    fontFamily: styles.getPropertyValue("--font-body").trim() || "system-ui, sans-serif",
    fontSize: "14px",
  };
}

async function render(root: HTMLElement): Promise<void> {
  const source = root.querySelector<HTMLElement>("[data-diagram-source]");
  const target = root.querySelector<HTMLElement>("[data-diagram-output]");
  const definition = source?.textContent ?? "";

  if (!source || !target || !definition.trim()) return;

  try {
    const mermaid = await loadMermaid();

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: themeVariables(),
    });

    const id = `diagram-${Math.random().toString(36).slice(2, 10)}`;
    const { svg } = await mermaid.render(id, definition);

    target.innerHTML = svg;
    root.setAttribute("data-diagram-rendered", "");
  } catch {
    // A diagram that won't parse leaves the source visible rather than an
    // empty box — the reader still gets the content, and the author sees why.
    root.removeAttribute("data-diagram-rendered");
  }
}

/** Re-render on a theme flip: the SVG bakes its colours in at render time. */
function watchTheme(): void {
  if (themeWatcherBound) return;
  themeWatcherBound = true;

  new MutationObserver(() => {
    document.querySelectorAll<HTMLElement>(".diagram").forEach((el) => void render(el));
  }).observe(document.documentElement, { attributeFilter: ["data-theme"] });
}

export async function setupDiagram(root: HTMLElement): Promise<void> {
  if (root.hasAttribute("data-diagram-initialized")) return;
  root.setAttribute("data-diagram-initialized", "");

  watchTheme();
  await render(root);
}

export function setupAllDiagrams(): void {
  document.querySelectorAll<HTMLElement>(".diagram").forEach((el) => void setupDiagram(el));
}
