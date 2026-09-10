/**
 * Strip the demo content and make a fresh clone your own site.
 *
 * The starter ships a working demo — the Docsmith documentation set, its
 * branding, and an overview page that sells the template itself. That content
 * is deliberate: it is what makes a clone look like a real site on first
 * `npm run dev`, and every feature is demonstrated by a page that uses it. But
 * each of those files is something a new project has to find and rewrite, and
 * the two URL placeholders (astro.config.mjs `site`, seo.json `url`) break
 * canonicals, the sitemap and JSON-LD silently if missed. See
 * scripts/check/placeholders.mjs.
 *
 *   npm run reset:starter               interactive
 *   npm run reset:starter -- --dry-run  print the plan, write nothing
 *
 * Deletes files. Guarded on a clean git tree so `git checkout .` is always an undo.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dryRun = process.argv.includes("--dry-run");
const rl = createInterface({ input: process.stdin, output: process.stdout });

const changes = [];

function abs(relativePath) {
  return join(root, relativePath);
}

function record(message) {
  changes.push(message);
}

function writeText(relativePath, contents) {
  if (!dryRun) writeFileSync(abs(relativePath), contents);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(abs(relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function remove(relativePath, recursive = false) {
  if (!dryRun) rmSync(abs(relativePath), { force: true, recursive });
}

/** YAML double-quoted scalar. JSON's string escaping is a valid subset. */
function yaml(value) {
  return JSON.stringify(value);
}

function isGitClean() {
  try {
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
    });

    return status.trim() === "";
  } catch {
    return true; // not a git repo — nothing to protect
  }
}

/**
 * Pull one line at a time. `rl.question()` drops input when stdin is a pipe —
 * readline drains the pipe and emits every line before the next question()
 * registers a listener. The async iterator pauses between reads, so piped input
 * (and `--dry-run` in a test) behaves the same as a person typing.
 */
const lines = rl[Symbol.asyncIterator]();

async function prompt(text) {
  process.stdout.write(text);
  const { value, done } = await lines.next();

  if (done) {
    process.stdout.write("\n");
    return null;
  }
  return value;
}

function bail() {
  console.log("\n  Cancelled — nothing was written.\n");
  rl.close();
  process.exit(1);
}

async function ask(question, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await prompt(`  ${question}${suffix}: `);

  if (answer === null) bail();
  return answer.trim() || fallback;
}

async function confirm(question, defaultYes = true) {
  const answer = await prompt(`  ${question} ${defaultYes ? "(Y/n)" : "(y/N)"} `);

  if (answer === null) bail();
  const normalized = answer.trim().toLowerCase();

  if (!normalized) return defaultYes;
  return normalized.startsWith("y");
}

function normalizeUrl(input) {
  let value = input.trim().replace(/\/+$/, "");

  if (!value) return null;
  if (!/^https?:\/\//.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function firstDoc(siteName) {
  return `---
title: Introduction
description: ${yaml(`What ${siteName} is, and who it is for.`)}
group: Getting started
order: 1
---

Replace this with the first thing a reader needs to know.
`;
}

function homepage(siteName) {
  return `---
_schema: default
title: Overview
description: ${yaml(`Welcome to ${siteName}.`)}
pageSections:
  - _component: page-sections/heroes/hero-center
    eyebrow: ""
    heading: ${yaml(siteName)}
    subtext: Replace this with a sentence about what you document.
    alignmentHorizontal: start
    buttonSections:
      - _component: building-blocks/core-elements/button
        text: Get started
        hideText: false
        link: "/introduction/"
        iconName: ""
        iconColor: default
        iconPosition: before
        variant: primary
        size: md
    maxContentWidth: 2xl
    paddingHorizontal: lg
    paddingVertical: 4xl
    colorScheme: inherit
    backgroundColor: base
    background:
      type: image
      positionVertical: top
      positionHorizontal: center
      priority: false
      imageSource: ""
      imageAlt: ""
      videoSource: null
      overlay: 0
---
`;
}

console.log("\n  Reset the documentation starter\n");
if (dryRun) console.log("  Dry run — nothing will be written.\n");

if (!dryRun && !isGitClean()) {
  console.log("  Your git working tree has uncommitted changes.");
  console.log("  This script deletes files; commit or stash first so you can undo.\n");
  const proceed = await confirm("Continue anyway?", false);

  if (!proceed) {
    rl.close();
    process.exit(1);
  }
  console.log("");
}

const siteName = await ask("Site name", "");

if (!siteName) {
  console.log("\n  A site name is required.\n");
  rl.close();
  process.exit(1);
}

let siteUrl = null;

while (!siteUrl) {
  siteUrl = normalizeUrl(await ask("Production URL", ""));
  if (!siteUrl) console.log("  Enter a valid URL, e.g. https://acme.com");
}

const docFiles = existsSync(abs("src/content/docs"))
  ? readdirSync(abs("src/content/docs")).filter((file) => file.endsWith(".mdx"))
  : [];

const removeDocs = docFiles.length
  ? await confirm(`Remove the demo documentation pages (${docFiles.length})?`)
  : false;
const removePages = await confirm("Reset the overview page?");
const resetBranding = await confirm("Reset header/footer/SEO branding?");

// astro.config.mjs: the placeholder that breaks every absolute URL.
const configPath = "astro.config.mjs";
const config = readFileSync(abs(configPath), "utf8");
const nextConfig = config.replace(/site: "https:\/\/example\.com",.*$/m, `site: ${yaml(siteUrl)},`);

if (nextConfig !== config) {
  writeText(configPath, nextConfig);
  record(`${configPath}   site → ${siteUrl}`);
}

// SEO defaults.
const seo = readJson("src/data/seo.json");

seo.name = siteName;
seo.url = siteUrl;
seo.titleFormat = `{title} | ${siteName}`;
if (resetBranding) {
  seo.description = `Welcome to ${siteName}.`;
  seo.logoSource = "";
}
writeJson("src/data/seo.json", seo);
record(`src/data/seo.json  name, url, titleFormat${resetBranding ? ", description, logo" : ""}`);

// Demo content.
if (removeDocs) {
  for (const file of docFiles) remove(`src/content/docs/${file}`);
  writeText("src/content/docs/introduction.mdx", firstDoc(siteName));
  record(
    `removed ${docFiles.length} demo page${docFiles.length === 1 ? "" : "s"}, wrote a blank Introduction`
  );
}

if (removePages) {
  writeText("src/content/pages/index.md", homepage(siteName));
  record("reset the overview page to a blank hero");
}

if (resetBranding) {
  const site = readJson("src/data/docsSite.json");

  site.markLetter = siteName.trim().charAt(0).toUpperCase();
  site.wordmark = siteName;
  site.logoSource = "";
  site.logoAlternateSource = "";
  site.logoAlt = siteName;
  site.version = "";
  site.editPageBaseUrl = "";
  site.topbarLinks = [];
  // Groups are matched to page frontmatter by name, so an inherited list would
  // point at groups the new site's pages don't use.
  site.navGroups = [{ name: "Getting started", collapsed: false }];
  writeJson("src/data/docsSite.json", site);
  record("src/data/docsSite.json  branding cleared, nav groups reduced to one");

  const footer = readJson("src/data/footer.json");

  footer.links = [];
  footer.socials = [];
  footer.footerText = `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  writeJson("src/data/footer.json", footer);
  record("src/data/footer.json  links and socials emptied, copyright set");

  const announcement = readJson("src/data/announcementBar.json");

  announcement.enabled = false;
  announcement.text = "";
  writeJson("src/data/announcementBar.json", announcement);
  record("src/data/announcementBar.json  disabled and cleared");
}

rl.close();

console.log("");
for (const change of changes) console.log(`  ✔ ${change}`);
console.log("");

if (dryRun) {
  console.log("  Dry run — no files were written.\n");
} else {
  console.log("  Next:");
  if (resetBranding)
    console.log("    • Add your logo — src/data/mainNav.json, footer.json, seo.json");
  console.log("    • Write your description — src/data/seo.json");
  console.log("    • Set your colours and fonts — src/styles/themes/, site-fonts.mjs");
  console.log("    • npm run dev\n");
}
