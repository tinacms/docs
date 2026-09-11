import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import fg from "fast-glob";

const ROOT = path.resolve(__dirname, "..");

const LOCALES = [
  {
    key: "en",
    contentDir: "content/docs",
    tocs: {
      docs: "content/docs-toc/docs-toc.json",
      learn: "content/docs-toc/learn-toc.json",
    },
    navFile: "content/navigation-bar/docs-navigation-bar.json",
    tabTitles: { docs: "Docs", learn: "Learn" },
    locale: "en",
  },
  {
    key: "zh",
    contentDir: "content/docs-zh",
    tocs: {
      docs: "content/docs-toc/docs-zh-toc.json",
      learn: "content/docs-toc/learn-zh-toc.json",
    },
    navFile: "content/navigation-bar/docs-navigation-bar-zh.json",
    tabTitles: { docs: "文档", learn: "学习" },
    locale: "zh",
  },
] as const;

type Locale = (typeof LOCALES)[number];

const TAG_RENAMES = [
  { from: "WarningCallout", to: "Callout", insert: ' variant="warning"' },
  { from: "Youtube", to: "youtube" },
  { from: "scrollBasedShowcase", to: "scrollShowcase" },
  { from: "apiReference", to: "propertyTable" },
  {
    from: "youtubeEmbed",
    to: "youtube",
    attributes: { url: "embedSrc", description: "caption" },
  },
] as const;

const ALLOWED_TAGS = new Set([
  "Callout",
  "youtube",
  "scrollShowcase",
  "accordionBlock",
  "cardGrid",
  "recipe",
  "imageEmbed",
  "GraphQLCodeBlock",
  "WebmEmbed",
  "ImageAndText",
  "Iframe",
  "SummaryTab",
  "propertyTable",
]);

const KEPT_FRONTMATTER_KEYS = new Set([
  "title",
  "seo",
  "alias",
  "next",
  "previous",
  "last_edited",
  "tocIsHidden",
  "cmsUsageWarning",
]);

const ZH_TOC_SLUG_PREFIX = "content/zh/docs/";

const FRONTMATTER = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;
const FRONTMATTER_KEY = /^([A-Za-z_][\w-]*)\s*:/;
const EMPTY_SCALAR = /^(''|""|)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const LINE_START_TAG = /^<([A-Za-z][A-Za-z0-9]*)(?=[\s/>]|$)/;
const LINE_START_CLOSING_TAG = /^<\/([A-Za-z][A-Za-z0-9]*)>/;
const MEDIA_EXTENSION = "png|jpe?g|gif|svg|webp|webm|mp4|mov|pdf";
const MEDIA_REF = new RegExp(
  `<(\\/(?!\\/)[^>\\n]+?\\.(?:${MEDIA_EXTENSION}))>|(?<![\\w./:-])(\\/(?!\\/)[^\\s"'()<>\`\\]]+?\\.(?:${MEDIA_EXTENSION}))(?!\\w)`,
  "gi"
);

type Location = { file: string; line: number };
type Reference = Location & { field: string; target: string };

type Summary = {
  files: Record<Locale["key"], { in: number; out: number }>;
  renames: Record<string, number>;
  embeds: Record<string, number>;
  unmappedTags: (Location & { tag: string })[];
  droppedKeys: Record<string, string[]>;
  emptyReferencesStripped: Record<string, number>;
  mediaCopied: number;
  mediaMissing: (Location & { ref: string })[];
  redirectsWritten: number;
  redirectsOutsideDocs: { source: string; destination: string }[];
  navItems: Record<Locale["key"], Record<"docs" | "learn", number>>;
  navTitleOverrides: Record<string, number>;
  dangling: Reference[];
};

const { values: args } = parseArgs({
  options: {
    source: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

if (!args.source) {
  process.stderr.write(
    "Usage: pnpm tsx scripts/migrate-from-tina-io.ts --source <path-to-tina.io> [--dry-run]\n"
  );
  process.exit(2);
}

const SOURCE = path.resolve(args.source);
const dryRun = args["dry-run"];

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const REQUIRED_SOURCE_PATHS = [
  ...LOCALES.flatMap((locale) => [
    locale.contentDir,
    locale.tocs.docs,
    locale.tocs.learn,
  ]),
  "content/settings/config.json",
];
const missingSourcePaths = REQUIRED_SOURCE_PATHS.filter(
  (relativePath) => !fs.existsSync(path.join(SOURCE, relativePath))
);
if (missingSourcePaths.length > 0) {
  fail(
    `${SOURCE} does not look like a tina.io checkout; missing ${missingSourcePaths.join(", ")}`
  );
}

const summary: Summary = {
  files: { en: { in: 0, out: 0 }, zh: { in: 0, out: 0 } },
  renames: {},
  embeds: {},
  unmappedTags: [],
  droppedKeys: {},
  emptyReferencesStripped: {},
  mediaCopied: 0,
  mediaMissing: [],
  redirectsWritten: 0,
  redirectsOutsideDocs: [],
  navItems: { en: { docs: 0, learn: 0 }, zh: { docs: 0, learn: 0 } },
  navTitleOverrides: {},
  dangling: [],
};

const bump = (counter: Record<string, number>, key: string) => {
  counter[key] = (counter[key] ?? 0) + 1;
};

const writeFile = (relativePath: string, content: string) => {
  if (dryRun) return;
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const writeJson = (relativePath: string, value: unknown) =>
  writeFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);

const readJson = <T>(absolutePath: string): T => {
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    if (error instanceof Error) {
      return fail(`Cannot read ${absolutePath}: ${error.message}`);
    }
    throw error;
  }
};

const mediaReferences = new Map<string, Location[]>();

const collectMedia = (line: string, location: Location) => {
  for (const [, angle, bare] of line.matchAll(MEDIA_REF)) {
    const ref = angle ?? bare ?? "";
    const refs = mediaReferences.get(ref) ?? [];
    refs.push(location);
    mediaReferences.set(ref, refs);
  }
};

const unquote = (scalar: string) => scalar.replace(/^(['"])(.*)\1$/, "$2");

const migrateFrontmatter = (raw: string, file: string) => {
  const kept: string[] = [];
  const references: Reference[] = [];
  let title: string | undefined;
  let currentKey: string | undefined;
  let keepCurrent = true;
  for (const [index, line] of raw.split("\n").entries()) {
    const keyMatch = line.match(FRONTMATTER_KEY);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = line.slice(keyMatch[0].length).trim();
      keepCurrent = KEPT_FRONTMATTER_KEYS.has(currentKey);
      if (!keepCurrent && currentKey !== "id") {
        const files = summary.droppedKeys[currentKey] ?? [];
        files.push(file);
        summary.droppedKeys[currentKey] = files;
      }
      if (currentKey === "title") title = unquote(value);
      if (currentKey === "next" || currentKey === "previous") {
        if (EMPTY_SCALAR.test(value)) {
          bump(summary.emptyReferencesStripped, currentKey);
          keepCurrent = false;
        } else {
          references.push({
            file,
            line: 0,
            field: currentKey,
            target: unquote(value),
          });
        }
      }
    }
    if (keepCurrent) {
      collectMedia(line, { file, line: index + 2 });
      kept.push(line);
    }
  }
  return { frontmatter: kept.join("\n"), references, title };
};

const renameTag = (line: string) => {
  const closing = line.match(LINE_START_CLOSING_TAG);
  if (closing) {
    const rule = TAG_RENAMES.find((candidate) => candidate.from === closing[1]);
    if (!rule) return { line, attributes: undefined };
    bump(summary.renames, `</${rule.from}> -> </${rule.to}>`);
    return {
      line: `</${rule.to}>${line.slice(closing[0].length)}`,
      attributes: undefined,
    };
  }
  const opening = line.match(LINE_START_TAG);
  if (!opening) return { line, attributes: undefined };
  const rule = TAG_RENAMES.find((candidate) => candidate.from === opening[1]);
  if (!rule) return { line, attributes: undefined };
  const insert = "insert" in rule ? rule.insert : "";
  bump(summary.renames, `<${rule.from}> -> <${rule.to}${insert}>`);
  return {
    line: `<${rule.to}${insert}${line.slice(opening[0].length)}`,
    attributes: "attributes" in rule ? rule.attributes : undefined,
  };
};

const renameAttributes = (
  line: string,
  attributes: Readonly<Record<string, string>>
) =>
  Object.entries(attributes).reduce(
    (current, [from, to]) =>
      current.replace(new RegExp(`(?<![\\w-])${from}=`, "g"), `${to}=`),
    line
  );

const migrateBody = (body: string, file: string, lineOffset: number) => {
  const out: string[] = [];
  let fence: { char: string; length: number } | undefined;
  let openTagAttributes: Readonly<Record<string, string>> | undefined;
  for (const [index, rawLine] of body.split("\n").entries()) {
    const location = { file, line: lineOffset + index };
    const fenceMatch = rawLine.match(FENCE);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.char &&
        fenceMatch[1].length >= fence.length &&
        rawLine.trim() === fenceMatch[1]
      ) {
        fence = undefined;
      }
      out.push(rawLine);
      continue;
    }
    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], length: fenceMatch[1].length };
      out.push(rawLine);
      continue;
    }

    let line = rawLine;
    if (openTagAttributes) {
      line = renameAttributes(line, openTagAttributes);
    } else {
      const renamed = renameTag(line);
      line = renamed.line;
      if (renamed.attributes) {
        line = renameAttributes(line, renamed.attributes);
        openTagAttributes = renamed.attributes;
      }
    }
    if (openTagAttributes && line.includes(">")) openTagAttributes = undefined;

    const tag = line.match(LINE_START_TAG)?.[1];
    if (tag) {
      if (ALLOWED_TAGS.has(tag)) bump(summary.embeds, tag);
      else summary.unmappedTags.push({ ...location, tag });
    }
    collectMedia(line, location);
    out.push(line);
  }
  return out.join("\n");
};

const migrateDocs = (locale: Locale) => {
  const sourceDir = path.join(SOURCE, locale.contentDir);
  const files = fg.sync("**/*.mdx", { cwd: sourceDir, dot: false }).sort();
  summary.files[locale.key].in = files.length;

  if (!dryRun) {
    fs.rmSync(path.join(ROOT, locale.contentDir), {
      recursive: true,
      force: true,
    });
  }

  const references: Reference[] = [];
  const titles = new Map<string, string>();
  for (const file of files) {
    const relativePath = path.posix.join(locale.contentDir, file);
    const text = fs
      .readFileSync(path.join(sourceDir, file), "utf8")
      .replace(/\r\n/g, "\n");
    const match = text.match(FRONTMATTER);
    const rawFrontmatter = match?.[1] ?? "";
    const body = match ? text.slice(match[0].length) : text;
    const bodyLineOffset = match ? match[0].split("\n").length : 1;

    const migrated = migrateFrontmatter(rawFrontmatter, relativePath);
    references.push(...migrated.references);
    if (migrated.title !== undefined) titles.set(relativePath, migrated.title);
    const migratedBody = migrateBody(body, relativePath, bodyLineOffset);
    const output = `---\n${migrated.frontmatter}\n---\n${migratedBody}`.replace(
      /\n*$/,
      "\n"
    );
    if (!dryRun) {
      writeFile(relativePath, output);
      summary.files[locale.key].out += 1;
    }
  }
  return { titles, references };
};

const safeDecode = (ref: string) => {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
};

const copyMedia = () => {
  for (const [ref, locations] of mediaReferences) {
    const decoded = safeDecode(ref);
    const source = path.join(SOURCE, "public", decoded);
    if (!fs.existsSync(source)) {
      summary.mediaMissing.push({ ...locations[0], ref });
      continue;
    }
    if (!dryRun) {
      const target = path.join(ROOT, "public", decoded);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    summary.mediaCopied += 1;
  }
};

type TocEntry =
  | { title: string; slug: string; _template: "item" }
  | { title: string; items: TocEntry[]; _template?: "items" };
type Toc = { supermenuGroup: { title: string; items: TocEntry[] }[] };
type NavEntry =
  | { slug: string; title?: string; _template: "item" }
  | { title: string; items: NavEntry[]; _template: "items" };

type NavFile = {
  lightModeLogo?: string;
  darkModeLogo?: string;
  ctaButtons?: unknown;
};

const migrateNavigation = (locale: Locale, titles: Map<string, string>) => {
  const navSlugs: { slug: string; tab: string }[] = [];
  const convertEntry = (entry: TocEntry, tab: string): NavEntry => {
    if ("items" in entry) {
      return {
        title: entry.title,
        items: entry.items.map((item) => convertEntry(item, tab)),
        _template: "items",
      };
    }
    const slug = entry.slug.startsWith(ZH_TOC_SLUG_PREFIX)
      ? `content/docs-zh/${entry.slug.slice(ZH_TOC_SLUG_PREFIX.length)}`
      : entry.slug;
    navSlugs.push({ slug, tab });
    if (entry.title === titles.get(slug)) return { slug, _template: "item" };
    bump(summary.navTitleOverrides, locale.key);
    return { slug, title: entry.title, _template: "item" };
  };

  const tabs = (["docs", "learn"] as const).map((tab) => {
    const toc = readJson<Toc>(path.join(SOURCE, locale.tocs[tab]));
    const before = navSlugs.length;
    const supermenuGroup = toc.supermenuGroup.map((group) => ({
      title: group.title,
      items: group.items.map((item) => convertEntry(item, tab)),
    }));
    summary.navItems[locale.key][tab] = navSlugs.length - before;
    return {
      title: locale.tabTitles[tab],
      supermenuGroup,
      _template: "docsTab",
    };
  });

  for (const { slug, tab } of navSlugs) {
    if (!titles.has(slug)) {
      summary.dangling.push({
        file: locale.navFile,
        line: 0,
        field: `${tab} tab item`,
        target: slug,
      });
    }
  }

  const existing = readJson<NavFile>(path.join(ROOT, locale.navFile));
  writeJson(locale.navFile, {
    locale: locale.locale,
    lightModeLogo: existing.lightModeLogo,
    darkModeLogo: existing.darkModeLogo,
    tabs,
    ctaButtons: existing.ctaButtons,
  });
};

type Redirect = {
  source: string;
  destination: string;
  permanent: boolean;
  basePath?: false;
};

const isDocsRoute = (route: string) =>
  route === "/docs" || route.startsWith("/docs/");

const stripDocsPrefix = (route: string) =>
  isDocsRoute(route) ? route.slice(5) || "/" : route;

const migrateRedirects = () => {
  const sourceConfig = readJson<{ redirects: Redirect[] }>(
    path.join(SOURCE, "content/settings/config.json")
  );
  const redirects = sourceConfig.redirects
    .filter(({ source }) => isDocsRoute(source))
    .map(({ source, destination, permanent }): Redirect => {
      if (isDocsRoute(destination)) {
        return {
          source: stripDocsPrefix(source),
          destination: stripDocsPrefix(destination),
          permanent,
        };
      }
      summary.redirectsOutsideDocs.push({ source, destination });
      return { source, destination, permanent, basePath: false };
    });
  summary.redirectsWritten = redirects.length;

  const configPath = "content/settings/config.json";
  const config = readJson<Record<string, unknown>>(path.join(ROOT, configPath));
  writeJson(configPath, { ...config, redirects });
};

const checkDanglingReferences = (
  references: Reference[],
  titles: Map<string, string>
) => {
  for (const reference of references) {
    if (!titles.has(reference.target)) summary.dangling.push(reference);
  }
};

const runValidationGate = () => {
  if (dryRun) return true;
  const result = spawnSync(
    "pnpm",
    ["tinacms", "build", "--local", "--skip-cloud-checks"],
    { cwd: ROOT, stdio: "inherit" }
  );
  return result.status === 0;
};

const formatLocation = ({ file, line }: Location) =>
  line ? `${file}:${line}` : file;

const printSummary = (gatePassed: boolean) => {
  const lines: string[] = [];
  const section = (title: string, body: string[]) => {
    lines.push("", title, ...body.map((entry) => `  ${entry}`));
  };
  const counts = (record: Record<string, number>) =>
    Object.entries(record)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count]) => `${key}: ${count}`);

  lines.push(
    `Migration from tina.io${dryRun ? " (dry run, nothing written)" : ""}`,
    `Source: ${SOURCE}`
  );
  section(
    "Files",
    LOCALES.map(
      ({ key, contentDir }) =>
        `${key}: ${summary.files[key].in} in, ${summary.files[key].out} out (${contentDir})`
    )
  );
  section("Embeds rewritten", counts(summary.renames));
  section("Embed tags in output (allowed set)", counts(summary.embeds));
  section(
    `Unmapped tags (${summary.unmappedTags.length})`,
    summary.unmappedTags.map(
      (entry) => `<${entry.tag}> ${formatLocation(entry)}`
    )
  );
  section(
    "Empty next/previous stripped",
    counts(summary.emptyReferencesStripped)
  );
  section(
    "Frontmatter keys dropped besides id",
    Object.entries(summary.droppedKeys).flatMap(([key, files]) => [
      `${key}: ${files.length} file(s)`,
      ...files.map((file) => `  ${file}`),
    ])
  );
  section(
    `Media (${summary.mediaCopied} copied, ${summary.mediaMissing.length} unresolved)`,
    summary.mediaMissing.map(
      (entry) => `MISSING ${entry.ref} (${formatLocation(entry)})`
    )
  );
  section(
    `Redirects (${summary.redirectsWritten} written, ${summary.redirectsOutsideDocs.length} outside /docs with basePath: false)`,
    summary.redirectsOutsideDocs.map(
      ({ source, destination }) => `${source} -> ${destination}`
    )
  );
  section(
    "Navigation items",
    LOCALES.map(
      ({ key, navFile, tabTitles }) =>
        `${navFile}: ${tabTitles.docs} ${summary.navItems[key].docs}, ${tabTitles.learn} ${summary.navItems[key].learn}, title overrides ${summary.navTitleOverrides[key] ?? 0}`
    )
  );
  section(
    `Dangling references (${summary.dangling.length})`,
    summary.dangling.map(
      (entry) => `${formatLocation(entry)} ${entry.field} -> ${entry.target}`
    )
  );
  section("Validation gate", [
    dryRun
      ? "skipped (dry run)"
      : gatePassed
        ? "tinacms build passed"
        : "tinacms build FAILED",
  ]);
  process.stdout.write(`${lines.join("\n")}\n`);
};

const main = () => {
  const titles = new Map<string, string>();
  const references: Reference[] = [];
  for (const locale of LOCALES) {
    const result = migrateDocs(locale);
    for (const [file, title] of result.titles) titles.set(file, title);
    references.push(...result.references);
  }
  copyMedia();
  checkDanglingReferences(references, titles);
  for (const locale of LOCALES) migrateNavigation(locale, titles);
  migrateRedirects();

  const gatePassed = runValidationGate();
  printSummary(gatePassed);
  if (!gatePassed) process.exit(1);
};

main();
