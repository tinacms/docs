const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const entryPath = path.join(
  __dirname,
  "..",
  "public",
  "pagefind",
  "pagefind-entry.json"
);

if (!fs.existsSync(entryPath)) {
  process.stdout.write(
    "\x1b[33mPagefind index not found — building it now from your content.\n" +
      "   (First run only; this does a full build and can take a minute or two.)\x1b[0m\n"
  );
  execSync("pnpm build-local-pagefind", { stdio: "inherit" });
  process.exit(0);
}

const stats = fs.statSync(entryPath);
const ageMs = Date.now() - stats.mtimeMs;
const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

if (ageDays >= 7) {
  process.stderr.write(
    `\x1b[33m⚠  Pagefind index is ${ageDays} day${ageDays === 1 ? "" : "s"} old. Search results may be stale.\n   Run: pnpm build-local-pagefind\x1b[0m\n`
  );
}
