// Builds urls.txt for scripts/crawl-compare.ts from a tina.io checkout:
// every content/docs/**/*.mdx and content/docs-zh/**/*.mdx becomes a doc URL,
// and every `alias` frontmatter value becomes an alias-redirect URL. Usage:
//
//   pnpm tsx scripts/list-tina-io-doc-urls.ts --root /path/to/tina.io [--out urls.txt]

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import { parseArgs } from "node:util";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const ALIAS_LINE = /^alias:\s*(.+)$/m;

// content/docs/index.mdx -> "", content/docs/going-live/foo.mdx -> "/going-live/foo"
export function mdxPathToSlug(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.mdx$/, "");
  return withoutExt === "index" ? "" : `/${withoutExt}`;
}

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function findMdxFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.endsWith(".mdx")
    )
    .map(toPosix);
}

function extractAlias(fileContents: string): string | null {
  const frontmatter = fileContents.match(FRONTMATTER);
  if (!frontmatter) return null;
  const alias = frontmatter[1].match(ALIAS_LINE);
  return alias ? alias[1].trim() : null;
}

interface CollectedUrls {
  urls: string[];
  aliases: string[];
}

function collectUrls(
  contentRoot: string,
  docsDir: string,
  urlPrefix: string
): CollectedUrls {
  const dir = join(contentRoot, docsDir);
  const urls: string[] = [];
  const aliases: string[] = [];

  for (const file of findMdxFiles(dir)) {
    urls.push(`${urlPrefix}${mdxPathToSlug(file)}`);
    const alias = extractAlias(readFileSync(join(dir, file), "utf8"));
    if (alias) aliases.push(alias);
  }

  return { urls, aliases };
}

function main(): void {
  const { values } = parseArgs({
    options: {
      root: { type: "string" },
      out: { type: "string", default: "urls.txt" },
    },
  });

  if (!values.root) {
    console.error(
      "Usage: list-tina-io-doc-urls --root <path-to-tina.io-checkout> [--out urls.txt]"
    );
    process.exitCode = 1;
    return;
  }

  const docs = collectUrls(values.root, "content/docs", "/docs");
  const docsZh = collectUrls(values.root, "content/docs-zh", "/zh/docs");
  const aliasUrls = [...new Set([...docs.aliases, ...docsZh.aliases])].map(
    (alias) => `/docs/r/${alias}`
  );

  const urls = [...docs.urls, ...docsZh.urls, ...aliasUrls].sort();
  const outPath = values.out ?? "urls.txt";

  writeFileSync(outPath, `${urls.join("\n")}\n`);
  console.log(`Wrote ${urls.length} URLs to ${outPath}`);
}

main();
