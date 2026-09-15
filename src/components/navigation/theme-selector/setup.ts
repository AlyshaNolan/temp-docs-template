/**
 * Theme selector — the starter's worked example of the CloudCannon Visual
 * Editor JavaScript API.
 *
 * Four API calls carry the whole feature:
 *
 *   window.CloudCannonAPI.useVersion("v1", true)   the API, without the global install
 *   api.file(path)                                 address a file that is not the open one
 *   file.data.edit({ slug, position })             open CloudCannon's own inputs panel
 *   file.data.addEventListener("change", …)        fires on every keystroke in that panel
 *
 * The change handler only writes custom properties onto `<html>`. They inherit,
 * so every element — including a section pinning its own `data-theme` — repaints
 * in the same frame. Nothing re-renders and no stylesheet is rewritten, which is
 * why a dragged colour picker tracks live.
 */

import type {
  CloudCannonEditorWindow,
  CloudCannonJavaScriptV1API,
  CloudCannonJavaScriptV1APIFile,
} from "@cloudcannon/javascript-api";
import { themeCustomProperties } from "@utils/themeTokens.mjs";
import { onPageLoad } from "@component-utils/onPageLoad";

const THEME_FILE = "src/data/theme.json";
const THEME_SLUG = "theme";

declare const window: CloudCannonEditorWindow;

/**
 * The properties this module last wrote. A client-side navigation serves the
 * page as it was built, so unsaved edits have to be reapplied over it.
 */
let applied: Record<string, string> = {};

function apply(properties: Record<string, string>) {
  const { style } = document.documentElement;

  for (const name of Object.keys(applied)) {
    if (!(name in properties)) style.removeProperty(name);
  }

  for (const [name, value] of Object.entries(properties)) {
    style.setProperty(name, value);
  }

  applied = properties;
}

function readTheme(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const theme = (data as Record<string, unknown>)[THEME_SLUG];

  return theme && typeof theme === "object" && !Array.isArray(theme)
    ? (theme as Record<string, unknown>)
    : {};
}

/**
 * CloudCannon has answered to both the bare and the leading-slash spelling of a
 * source path. A wrong guess throws nothing useful — `data.get()` just resolves
 * `undefined` — so probe once and keep the spelling that returns data.
 */
async function resolveThemeFile(
  api: CloudCannonJavaScriptV1API
): Promise<CloudCannonJavaScriptV1APIFile | undefined> {
  for (const path of [THEME_FILE, `/${THEME_FILE}`]) {
    try {
      const file = api.file(path);

      if (await file.data.get()) return file;
    } catch {
      // Next spelling.
    }
  }

  return undefined;
}

async function wire(element: HTMLElement, api: CloudCannonJavaScriptV1API) {
  const file = await resolveThemeFile(api);

  if (!file) {
    console.warn(`[theme-selector] ${THEME_FILE} is not editable here.`);

    return;
  }

  const repaint = async () => apply(themeCustomProperties(readTheme(await file.data.get())));

  const trigger = element.querySelector<HTMLButtonElement>(".theme-selector-trigger");

  trigger?.addEventListener("click", (event) => {
    const rect = trigger.getBoundingClientRect();

    file.data.edit({
      slug: THEME_SLUG,
      position: {
        x: event.clientX,
        y: event.clientY,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
  });

  file.data.addEventListener("change", repaint);
  onPageLoad(() => {
    apply(applied);
  });

  await repaint();
  element.hidden = false;
}

export function setupThemeSelector(element: HTMLElement) {
  if (element.dataset.themeSelectorInitialized !== undefined) return;
  element.dataset.themeSelectorInitialized = "";

  const start = () => {
    const api = window.CloudCannonAPI?.useVersion("v1", true);

    if (api) wire(element, api);
  };

  if (window.CloudCannonAPI) start();
  else document.addEventListener("cloudcannon:load", start, { once: true });
}

export function setupAllThemeSelectors(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLElement>(".theme-selector:not([data-theme-selector-initialized])")
    .forEach(setupThemeSelector);
}
