/**
 * Turns `src/data/theme.json` into the custom properties `<html>` carries.
 *
 * Three rules this module and `styles/themes/*.css` keep between them:
 *
 * 1. Every property here is optional. The theme files read them as
 *    `var(--accent-light, var(--teal-700))`, so a missing or malformed value
 *    leaves the shipped design standing instead of blanking a token — an
 *    unresolved `var()` with no fallback is invalid at computed-value time and
 *    fails silently.
 * 2. They are set on `<html>` and inherit, which is what lets a section pinning
 *    its own `data-theme` pick them up. Never scope them to a selector.
 * 3. A picked colour produces its whole family here, not in CSS, so the editor
 *    only ever chooses one swatch per role.
 *
 * Dependency-free ESM: it runs in Astro frontmatter at build time and in the
 * editor bundle at runtime, and the two must agree.
 */

const INK = [8, 9, 11]; // --black
const PAPER = [255, 255, 255]; // --white

/** The ground each scheme mixes surfaces and muted tones against. */
const GROUND = { light: PAPER, dark: INK };

/** Parse `#rgb` / `#rrggbb` (with or without the hash) into RGB, or null. */
export function parseHex(value) {
  if (typeof value !== "string") return null;

  const hex = value.trim().replace(/^#/, "");

  if (/^[\da-f]{3}$/i.test(hex)) {
    return [...hex].map((c) => parseInt(c + c, 16));
  }

  if (/^[\da-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }

  return null;
}

function toHex(rgb) {
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

/** Blend `rgb` with `ground`, `weight` being the share kept of `rgb`. */
function mix(rgb, ground, weight) {
  return rgb.map((c, i) => c * weight + ground[i] * (1 - weight));
}

/** WCAG relative luminance, used only to choose ink or paper for text. */
function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;

    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The legible text colour to sit on `rgb`. */
export function readableOn(rgb) {
  return toHex(luminance(rgb) > 0.42 ? INK : PAPER);
}

const SCHEMES = ["light", "dark"];
const capitalise = (word) => word[0].toUpperCase() + word.slice(1);

/**
 * @param {Record<string, unknown>} theme the `theme` object from theme.json
 * @returns {Record<string, string>} custom properties to set on `<html>`
 */
export function themeCustomProperties(theme = {}) {
  const properties = {};

  for (const scheme of SCHEMES) {
    const ground = GROUND[scheme];
    // Hover moves away from the page: darker on light, lighter on dark.
    const shade = scheme === "light" ? INK : PAPER;

    const accent = parseHex(theme[`accent${capitalise(scheme)}`]);

    if (accent) {
      properties[`--accent-${scheme}`] = toHex(accent);
      properties[`--accent-${scheme}-hover`] = toHex(mix(accent, shade, 0.82));
      properties[`--accent-${scheme}-on`] = readableOn(accent);
      properties[`--accent-${scheme}-surface`] = toHex(mix(accent, ground, 0.08));
      properties[`--accent-${scheme}-border`] = toHex(mix(accent, ground, 0.3));
    }

    const brand = parseHex(theme[`brand${capitalise(scheme)}`]);

    if (brand) {
      properties[`--brand-${scheme}`] = toHex(brand);
      properties[`--brand-${scheme}-on`] = readableOn(brand);
      properties[`--brand-${scheme}-muted`] = toHex(mix(brand, ground, 0.85));
      properties[`--brand-${scheme}-subtle`] = toHex(mix(brand, ground, 0.62));
    }
  }

  return properties;
}

/** Serialise for an Astro `style` attribute. */
export function themeStyleAttribute(theme) {
  return Object.entries(themeCustomProperties(theme))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
}
