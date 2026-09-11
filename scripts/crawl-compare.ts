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
    console.error(
      "Usage: crawl-compare --old <url> --new <url> --urls <file> [--concurrency <n>] [--bypass-secret <secret>]"
    );
    process.exitCode = 1;
    return;
  }

  const oldBase = values.old;
  const newBase = values.new;
  const bypassSecret = values["bypass-secret"];
  const concurrency = Number.parseInt(values.concurrency ?? "8", 10);
  const paths = readUrlList(values.urls);

  const rows: ComparisonRow[] = [];
  const brokenLinks: BrokenLink[] = [];
  let hasNonOkOnNew = false;

  await mapWithConcurrency(paths, concurrency, async (path) => {
    const [oldOutcome, newOutcome] = await Promise.all([
      fetchPage(resolveUrl(oldBase, path)),
      fetchPage(resolveUrl(newBase, path), { bypassSecret }),
    ]);

    if (newOutcome.status !== 200) hasNonOkOnNew = true;
    rows.push({ path, diffs: compareCrawlOutcomes(oldOutcome, newOutcome) });

    const docLinks = extractDocLinks(newOutcome.html);
    await Promise.all(
      docLinks.map(async (link) => {
        const status = await headStatus(resolveUrl(newBase, link), {
          bypassSecret,
        });
        if (isBrokenStatus(status)) brokenLinks.push({ path, link, status });
      })
    );
  });

  rows.sort((a, b) => a.path.localeCompare(b.path));
  brokenLinks.sort(
    (a, b) => a.path.localeCompare(b.path) || a.link.localeCompare(b.link)
  );

  const report = renderReport(rows, brokenLinks);
  console.log(report);
  writeFileSync("crawl-report.md", report);

  process.exitCode = hasNonOkOnNew ? 1 : 0;
}

main();
