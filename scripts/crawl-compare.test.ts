import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  compareCrawlOutcomes,
  extractDocLinks,
} from "./crawl-compare-comparator";
import { renderReport } from "./crawl-compare-report";

const OLD_HTML = `
<html>
<head>
  <title>Old Title</title>
  <link rel="canonical" href="https://tina.io/docs/foo" />
  <link rel="alternate" hreflang="zh" href="https://tina.io/zh/docs/foo" />
</head>
<body>
  <h1>Old Heading</h1>
</body>
</html>
`;

const NEW_HTML_SAME = `
<html>
<head>
  <title>Old Title</title>
  <link rel="canonical" href="https://tina.io/docs/foo" />
  <link rel="alternate" hreflang="zh" href="https://tina.io/zh/docs/foo" />
</head>
<body>
  <h1>Old Heading</h1>
</body>
</html>
`;

const NEW_HTML_DIFFERENT = `
<html>
<head>
  <title>New Title</title>
</head>
<body>
  <h1>New Heading</h1>
  <a href="/docs/bar">Bar</a>
  <a href="/docs/bar">Bar again</a>
  <a href="/docs/baz">Baz</a>
  <a href="/other">Other</a>
</body>
</html>
`;

test("compareCrawlOutcomes reports no diffs when status, title, h1, canonical, and hreflang all match", () => {
  const diffs = compareCrawlOutcomes(
    { status: 200, finalPath: "/docs/foo", html: OLD_HTML },
    { status: 200, finalPath: "/docs/foo", html: NEW_HTML_SAME }
  );

  assert.deepEqual(diffs, []);
});

test("compareCrawlOutcomes flags status, title, h1, and a dropped canonical/hreflang", () => {
  const diffs = compareCrawlOutcomes(
    { status: 200, finalPath: "/docs/foo", html: OLD_HTML },
    { status: 404, finalPath: "/docs/foo", html: NEW_HTML_DIFFERENT }
  );

  const fields = diffs.map((diff) => diff.field).sort();
  assert.deepEqual(fields, ["canonical", "h1", "hreflang", "status", "title"]);
});

test("extractDocLinks collects unique /docs links and ignores other hrefs", () => {
  const links = extractDocLinks(NEW_HTML_DIFFERENT);
  assert.deepEqual(links.sort(), ["/docs/bar", "/docs/baz"]);
});

test("renderReport tables a row per diff and lists broken links", () => {
  const report = renderReport(
    [{ path: "/docs/foo", diffs: [{ field: "title", old: "A", new: "B" }] }],
    [{ path: "/docs/foo", link: "/docs/missing", status: 404 }]
  );

  assert.match(report, /\| \/docs\/foo \| title \| A \| B \|/);
  assert.match(report, /\| \/docs\/foo \| \/docs\/missing \| 404 \|/);
});
