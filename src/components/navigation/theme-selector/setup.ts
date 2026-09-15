/**
 * Theme selector — the starter's worked example of the CloudCannon Visual
 * Editor JavaScript API.
 *
 * The API call that matters for live preview is `api.dataset("theme")`, not
 * `api.file("src/data/theme.json")`. Both read the same JSON, but CloudCannon
 * fires `change` on the *dataset* handle while a panel is open; the file handle
 * only settles up later, which shows as a theme that repaints on navigation but
 * not while you drag the colour picker. `@cloudcannon/editable-regions` resolves
 * every `@data[key]` binding the same way — see `nodes/editable.ts`. The dataset
 * only exists because `data_config.theme` is declared in `cloudcannon.config.yml`.
 *
 * The change handler writes custom properties onto `<html>`. They inherit, so
 * every element — including a section pinning its own `data-theme` — repaints in
 * the same frame, with no re-render and no stylesheet rewriting.
 *
 * The `themeSelector` switch is read from that same handle rather than gated at
 * build time, so unticking it hides the button in the same frame — a build-time
 * gate would leave no element to hide, and no way back without a rebuild.
 */

import type {
  CloudCannonEditorWindow,
  CloudCannonJavaScriptV1API,
  CloudCannonJavaScriptV1APIFile,
} from "@cloudcannon/javascript-api";
import { themeCustomProperties } from "@utils/themeTokens.mjs";
import { onPageLoad } from "@component-utils/onPageLoad";

const THEME_DATASET = "theme";
const VISIBILITY_KEY = "themeSelector";
const THEME_FILE = "src/data/theme.json";
const THEME_SLUG = "theme";

/** How often the fallback poll re-reads while a panel is open, in ms. */
const POLL_INTERVAL = 300;
/** How long that poll runs before giving up, in ms. */
const POLL_LIMIT = 300_000;

declare const window: CloudCannonEditorWindow;

/**
 * What this module last wrote. A client-side navigation serves the page as it
 * was built, so unsaved edits have to be reapplied over it.
 */
let applied: Record<string, string> = {};
let visible = false;

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

/**
 * Every selector in the document, not the one `wire` was handed: a client-side
 * navigation swaps in a fresh copy that ships `hidden`.
 */
function setVisible(next: boolean) {
  visible = next;

  document.querySelectorAll<HTMLElement>(".theme-selector").forEach((element) => {
    element.hidden = !visible;
  });
}

function readVisible(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return true;

  return (data as Record<string, unknown>)[VISIBILITY_KEY] !== false;
}

function readTheme(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const theme = (data as Record<string, unknown>)[THEME_SLUG];

  return theme && typeof theme === "object" && !Array.isArray(theme)
    ? (theme as Record<string, unknown>)
    : {};
}

interface Source {
  /** The file to open a panel on and read through. */
  file: CloudCannonJavaScriptV1APIFile;
  /** Every handle that might emit `change` for this data. */
  emitters: { addEventListener(event: "change", fn: () => void): void }[];
}

/**
 * Resolve the theme data, preferring the dataset handle.
 *
 * CloudCannon has answered to both the bare and the leading-slash spelling of a
 * source path, and a wrong guess throws nothing useful — `data.get()` just
 * resolves `undefined` — so probe and keep whichever returns data.
 */
async function resolveSource(api: CloudCannonJavaScriptV1API): Promise<Source | undefined> {
  try {
    const dataset = api.dataset(THEME_DATASET);
    const items = await dataset.items();
    const file = Array.isArray(items) ? items[0] : items;

    if (file && (await file.data.get())) return { file, emitters: [dataset, file, api] };
  } catch {
    // No such dataset — fall through to the file paths.
  }

  for (const path of [THEME_FILE, `/${THEME_FILE}`]) {
    try {
      const file = api.file(path);

      if (await file.data.get()) return { file, emitters: [file, api] };
    } catch {
      // Next spelling.
    }
  }

  return undefined;
}

interface Live {
  /** The resolved data handle, for opening the panel. */
  file: CloudCannonJavaScriptV1APIFile;
  /** Starts the fallback poll when no change event has proven the subscription. */
  startPolling: () => void;
}

/**
 * One subscription for the document. A client-side navigation re-runs setup
 * against a fresh element; re-resolving would stack a second set of change
 * listeners on the same handle, each re-reading on every drag of the picker.
 */
let live: Promise<Live | undefined> | undefined;

function connect(api: CloudCannonJavaScriptV1API): Promise<Live | undefined> {
  live ??= (async () => {
    const source = await resolveSource(api);

    if (!source) {
      console.warn(`[theme-selector] ${THEME_FILE} is not editable here.`);

      return undefined;
    }

    const { file, emitters } = source;

    let queued = false;

    const repaint = () => {
      if (queued) return;
      queued = true;

      requestAnimationFrame(async () => {
        queued = false;

        const data = await file.data.get();

        apply(themeCustomProperties(readTheme(data)));
        setVisible(readVisible(data));
      });
    };

    // A change event proves the subscription reaches this frame, which is what
    // retires the poll below. Never assume it: this ran for a release subscribed
    // only to the file handle, where it never arrived.
    let liveEvents = false;
    let poll: ReturnType<typeof setInterval> | undefined;

    const stopPolling = () => {
      clearInterval(poll);
      poll = undefined;
    };

    for (const emitter of emitters) {
      emitter.addEventListener("change", () => {
        liveEvents = true;
        stopPolling();
        repaint();
      });
    }

    const startPolling = () => {
      if (liveEvents || poll) return;

      poll = setInterval(repaint, POLL_INTERVAL);
      setTimeout(stopPolling, POLL_LIMIT);
    };

    repaint();

    return { file, startPolling };
  })();

  return live;
}

async function wire(element: HTMLElement, api: CloudCannonJavaScriptV1API) {
  const connection = await connect(api);

  if (!connection) return;

  const { file, startPolling } = connection;
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

    startPolling();
  });

  setVisible(visible);
}

let pageLoadBound = false;

function bindPageLoad() {
  if (pageLoadBound) return;
  pageLoadBound = true;

  onPageLoad(() => {
    apply(applied);
    setVisible(visible);
    setupAllThemeSelectors();
  });
}

export function setupThemeSelector(element: HTMLElement) {
  bindPageLoad();

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
  bindPageLoad();

  root
    .querySelectorAll<HTMLElement>(".theme-selector:not([data-theme-selector-initialized])")
    .forEach(setupThemeSelector);
}
