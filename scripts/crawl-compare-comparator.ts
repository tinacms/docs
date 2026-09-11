// Pure HTML extraction and diffing for crawl-compare. No network access here,
// which is what lets scripts/crawl-compare.test.ts exercise it with fixture
// HTML strings instead of live requests.

export interface Hreflang {
  lang: string;
  href: string;
}

export interface CrawlOutcome {
  status: number;
  finalPath: string;
  html: string;
  // Set when the fetch itself failed (network error, timeout). status is 0
  // in that case, not a real HTTP status.
  error?: string;
}

export interface PageSnapshot {
  title: string | null;
  h1: string | null;
  canonical: string | null;
  hreflangs: Hreflang[];
}

export interface FieldDiff {
  field:
    | "status"
    | "finalPath"
    | "title"
    | "h1"
    | "canonical"
    | "hreflang"
    | "error";
  old: string;
  new: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
    (match, entity: string) => {
      if (entity.startsWith("#")) {
        const isHex = entity[1] === "x" || entity[1] === "X";
        const codePoint = Number.parseInt(
          entity.slice(isHex ? 2 : 1),
          isHex ? 16 : 10
        );
        return Number.isNaN(codePoint)
          ? match
          : String.fromCodePoint(codePoint);
      }
      return NAMED_ENTITIES[entity] ?? match;
    }
  );
}

function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

// Comments and script/style bodies can contain tag-shaped text (a
// commented-out <link>, a JS string literal with "<title>") that would
// otherwise look like real markup to the extractors below.
function stripNonContentMarkup(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

export function extractTitle(html: string): string | null {
  const match = stripNonContentMarkup(html).match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );
  return match ? cleanText(match[1]) : null;
}

export function extractFirstH1(html: string): string | null {
  const match = stripNonContentMarkup(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? cleanText(match[1]) : null;
}

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrPattern =
    /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
  for (const match of tag.matchAll(attrPattern)) {
    const name = (match[1] ?? match[3]).toLowerCase();
    attrs[name] = match[2] ?? match[4];
  }
  return attrs;
}

function findTags(html: string, tagName: string): string[] {
  return (
    stripNonContentMarkup(html).match(
      new RegExp(`<${tagName}\\b[^>]*>`, "gi")
    ) ?? []
  );
}

export function extractCanonical(html: string): string | null {
  for (const tag of findTags(html, "link")) {
    const attrs = parseAttrs(tag);
    if (attrs.rel?.toLowerCase() === "canonical") return attrs.href ?? null;
  }
  return null;
}

export function extractHreflangs(html: string): Hreflang[] {
  const hreflangs: Hreflang[] = [];
  for (const tag of findTags(html, "link")) {
    const attrs = parseAttrs(tag);
    if (
      attrs.rel?.toLowerCase() === "alternate" &&
      attrs.hreflang &&
      attrs.href
    ) {
      hreflangs.push({ lang: attrs.hreflang, href: attrs.href });
    }
  }
  return hreflangs.sort((a, b) => a.lang.localeCompare(b.lang));
}

// Internal docs links found on the new host's rendered page, so the caller
// can HEAD-check each one for link-integrity reporting.
export function extractDocLinks(html: string): string[] {
  const links = new Set<string>();
  for (const tag of findTags(html, "a")) {
    const href = parseAttrs(tag).href;
    if (href?.startsWith("/docs")) links.add(href);
  }
  return [...links];
}

export function parseSnapshot(html: string): PageSnapshot {
  return {
    title: extractTitle(html),
    h1: extractFirstH1(html),
    canonical: extractCanonical(html),
    hreflangs: extractHreflangs(html),
  };
}

function formatHreflangs(hreflangs: Hreflang[]): string {
  return hreflangs.map((h) => `${h.lang}:${h.href}`).join(", ");
}

export function compareCrawlOutcomes(
  oldOutcome: CrawlOutcome,
  newOutcome: CrawlOutcome
): FieldDiff[] {
  const oldSnapshot = parseSnapshot(oldOutcome.html);
  const newSnapshot = parseSnapshot(newOutcome.html);
  const diffs: FieldDiff[] = [];

  const compareField = (
    field: FieldDiff["field"],
    oldValue: string,
    newValue: string
  ) => {
    if (oldValue !== newValue)
      diffs.push({ field, old: oldValue, new: newValue });
  };

  // Always surfaced when either side failed to fetch, even if both sides
  // happen to produce the same error message.
  if (oldOutcome.error || newOutcome.error) {
    diffs.push({
      field: "error",
      old: oldOutcome.error ?? "",
      new: newOutcome.error ?? "",
    });
  }

  compareField("status", String(oldOutcome.status), String(newOutcome.status));
  compareField("finalPath", oldOutcome.finalPath, newOutcome.finalPath);
  compareField("title", oldSnapshot.title ?? "", newSnapshot.title ?? "");
  compareField("h1", oldSnapshot.h1 ?? "", newSnapshot.h1 ?? "");
  compareField(
    "canonical",
    oldSnapshot.canonical ?? "",
    newSnapshot.canonical ?? ""
  );
  compareField(
    "hreflang",
    formatHreflangs(oldSnapshot.hreflangs),
    formatHreflangs(newSnapshot.hreflangs)
  );

  return diffs;
}
