import type {
  CloudCannonJavaScriptV1API,
  CloudCannonJavaScriptV1APIFile,
} from "@cloudcannon/javascript-api";

export interface EditorDataSource {
  /** The file to open a panel on and read through. */
  file: CloudCannonJavaScriptV1APIFile;
  /** Every handle that might emit `change` for this data. */
  emitters: { addEventListener(event: "change", fn: () => void): void }[];
}

/**
 * Resolve a `src/data` JSON file to a live handle, preferring the dataset.
 *
 * Prefer the dataset because CloudCannon fires `change` on it while a panel is
 * open; the file handle only settles up later, which shows as chrome that
 * repaints on navigation but not while a field is being typed into. The dataset
 * only exists if the key is declared under `data_config` in
 * `cloudcannon.config.yml`.
 *
 * CloudCannon has answered to both the bare and the leading-slash spelling of a
 * source path, and a wrong guess throws nothing useful — `data.get()` just
 * resolves `undefined` — so probe and keep whichever returns data.
 */
export async function resolveDataSource(
  api: CloudCannonJavaScriptV1API,
  options: { dataset: string; path: string }
): Promise<EditorDataSource | undefined> {
  try {
    const dataset = api.dataset(options.dataset);
    const items = await dataset.items();
    const file = Array.isArray(items) ? items[0] : items;

    if (file && (await file.data.get())) return { file, emitters: [dataset, file, api] };
  } catch {
    // No such dataset — fall through to the file paths.
  }

  for (const path of [options.path, `/${options.path}`]) {
    try {
      const file = api.file(path);

      if (await file.data.get()) return { file, emitters: [file, api] };
    } catch {
      // Next spelling.
    }
  }

  return undefined;
}

/** Coalesce bursts of `change` events into one repaint per frame. */
export function framed(repaint: () => void): () => void {
  let queued = false;

  return () => {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      repaint();
    });
  };
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
