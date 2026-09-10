/**
 * Site font registration — single place to change families, weights, or provider.
 *
 * - Used by `astro.config.mjs` (`fonts`) and layout `<SiteFonts />` (preload / Font component).
 * - `cssVariable` values must match tokens consumed in CSS (`--font-body`, `--font-headings`, `--font-mono`).
 * - Prefer `fontProviders.fontsource()` (local via @fontsource packages) over remote providers.
 * - Use a weight range string (e.g. `"100 900"`) for variable fonts instead of discrete weights.
 *
 * @see https://docs.astro.build/en/guides/fonts/
 */
import { fontProviders } from "astro/config";

export const siteFonts = [
  {
    name: "Instrument Sans",
    cssVariable: "--font-body",
    provider: fontProviders.fontsource(),
    weights: ["400 700"],
    styles: ["normal"],
    subsets: ["latin"],
  },
  {
    name: "Instrument Sans",
    cssVariable: "--font-headings",
    provider: fontProviders.fontsource(),
    weights: ["400 700"],
    styles: ["normal"],
    subsets: ["latin"],
  },
  {
    name: "JetBrains Mono",
    cssVariable: "--font-mono",
    provider: fontProviders.fontsource(),
    weights: ["400 600"],
    styles: ["normal"],
    subsets: ["latin"],
  },
];
