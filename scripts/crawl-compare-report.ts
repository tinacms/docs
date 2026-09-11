import type { FieldDiff } from "./crawl-compare-comparator";

export interface ComparisonRow {
  path: string;
  diffs: FieldDiff[];
}

export interface BrokenLink {
  link: string;
  status: number;
  // Every page that linked to it; links are HEAD-checked once per run, not
  // once per referencing page.
  foundOn: string[];
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function renderReport(
  rows: ComparisonRow[],
  brokenLinks: BrokenLink[]
): string {
  const rowsWithDiffs = rows.filter((row) => row.diffs.length > 0);

  const lines = ["# Crawl Compare Report", "", "## Differences", ""];

  if (rowsWithDiffs.length === 0) {
    lines.push("No differences found.");
  } else {
    lines.push("| Path | Field | Old | New |", "| --- | --- | --- | --- |");
    for (const row of rowsWithDiffs) {
      for (const diff of row.diffs) {
        lines.push(
          `| ${row.path} | ${diff.field} | ${escapeCell(diff.old)} | ${escapeCell(diff.new)} |`
        );
      }
    }
  }

  lines.push("", "## Broken internal links (new host)", "");

  if (brokenLinks.length === 0) {
    lines.push("No broken links found.");
  } else {
    lines.push("| Link | Status | Found on |", "| --- | --- | --- |");
    for (const link of brokenLinks) {
      lines.push(
        `| ${link.link} | ${link.status} | ${escapeCell(link.foundOn.join(", "))} |`
      );
    }
  }

  lines.push(
    "",
    "## Summary",
    "",
    `Checked ${pluralize(rows.length, "URL")}. ${pluralize(rowsWithDiffs.length, "URL")} with differences. ${pluralize(brokenLinks.length, "broken link")}.`
  );

  return lines.join("\n");
}
