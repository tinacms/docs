// Crawls every path in a urls.txt against an old and new host, diffing what
// matters for SEO and link integrity ahead of the tina.io -> tina-docs
// cutover. Usage:
//
//   pnpm tsx scripts/crawl-compare.ts --old https://tina.io --new https://<preview> \
//     --urls urls.txt [--concurrency 8] [--bypass-secret <secret>]

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  compareCrawlOutcomes,
  extractDocLinks,
} from "./crawl-compare-comparator";
import {
  describeError,
  fetchPage,
  headStatus,
  mapWithConcurrency,
} from "./crawl-compare-fetch";
import {
  type BrokenLink,
  type ComparisonRow,
  renderReport,
} from "./crawl-compare-report";

function readUrlList(filePath: string): string[] {
  return readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function resolveUrl(base: string, path: string): string {
  return new URL(path, base).toString();
}

function isBrokenStatus(status: number): boolean {
  return status < 200 || status >= 300;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      old: { type: "string" },
      new: { type: "string" },
      urls: { type: "string" },
      concurrency: { type: "string", default: "8" },
      "bypass-secret": { type: "string" },
    },
  });

  if (!values.old || !values.new || !values.urls) {
    process.stderr.write(
      "Usage: crawl-compare --old <url> --new <url> --urls <file> [--concurrency <n>] [--bypass-secret <secret>]\n"
    );
    process.exitCode = 1;
    return;
  }

  const concurrencyRaw = values.concurrency ?? "8";
  const concurrency = Number.parseInt(concurrencyRaw, 10);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    process.stderr.write(
      `--concurrency must be a positive integer, got "${concurrencyRaw}"\n`
    );
    process.exitCode = 1;
    return;
  }

  const oldBase = values.old;
  const newBase = values.new;
  const bypassSecret = values["bypass-secret"];
  const paths = readUrlList(values.urls);

  const rows: ComparisonRow[] = [];
  // Which pages referenced each /docs link, so a link found on multiple
  // pages is still HEAD-checked exactly once.
  const linkToPages = new Map<string, Set<string>>();
  let hasNonOkOnNew = false;
  let hasRowFailure = false;

  await mapWithConcurrency(paths, concurrency, async (path) => {
    const [oldOutcome, newOutcome] = await Promise.all([
      fetchPage(resolveUrl(oldBase, path)),
      fetchPage(resolveUrl(newBase, path), { bypassSecret }),
    ]);

    if (newOutcome.status !== 200) hasNonOkOnNew = true;
    if (oldOutcome.error || newOutcome.error) hasRowFailure = true;
    rows.push({ path, diffs: compareCrawlOutcomes(oldOutcome, newOutcome) });

    for (const link of extractDocLinks(newOutcome.html)) {
      const pages = linkToPages.get(link) ?? new Set<string>();
      pages.add(path);
      linkToPages.set(link, pages);
    }
  });

  const uniqueLinks = [...linkToPages.keys()].sort();
  const linkStatuses = await mapWithConcurrency(
    uniqueLinks,
    concurrency,
    async (link) => ({
      link,
      status: await headStatus(resolveUrl(newBase, link), { bypassSecret }),
    })
  );

  const brokenLinks: BrokenLink[] = linkStatuses
    .filter(({ status }) => isBrokenStatus(status))
    .map(({ link, status }) => ({
      link,
      status,
      foundOn: [...(linkToPages.get(link) ?? [])].sort(),
    }));

  rows.sort((a, b) => a.path.localeCompare(b.path));
  brokenLinks.sort((a, b) => a.link.localeCompare(b.link));

  const report = renderReport(rows, brokenLinks);
  process.stdout.write(`${report}\n`);
  writeFileSync("crawl-report.md", report);

  process.exitCode = hasNonOkOnNew || hasRowFailure ? 1 : 0;
}

main().catch((err) => {
  process.stderr.write(`${describeError(err)}\n`);
  process.exitCode = 1;
});
