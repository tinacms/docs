# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## About this repo

This is the **TinaCMS documentation site**, served at `tina.io/docs` (and `tina.io/zh/docs`) through a rewrite from the tina.io Next.js app. It is a deployed instance of the [tina-docs](https://github.com/tinacms/tina-docs) starter, not the starter itself:

- Hardcoding tina.io values (URLs, branding, redirects, analytics) is fine here.
- Features only this site needs (tina.io header, `GraphQLCodeBlock`, alias permalinks, zh locale) are built here first. Upstreaming generic pieces to tina-docs is welcome but never blocks work here.
- Content is being migrated from [tina.io](https://github.com/tinacms/tina.io) `content/docs` and `content/docs-zh`. Progress, decisions, and open tasks live in the epic: https://github.com/tinacms/tinacms/issues/7552. Read it before starting migration work, and comment there with evidence links when you finish a task.

Deployment: Vercel, production branch `main`. TinaCloud project credentials live in Vercel env vars and GitHub Actions secrets.

## Architecture

Built on **Next.js 15 (App Router)** with **TinaCMS** for git-based content management, **Pagefind** for static search, and **Tailwind CSS**. The site uses the `tina` theme from tina-docs's theme system.

**Content flow:** MDX files in `content/docs/` → TinaCMS schema (`tina/collections/`) → auto-generated GraphQL client (`tina/__generated__/`) → Next.js pages. Never edit files in `tina/__generated__/`.

### Key directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/tina-markdown/` — Markdown rendering: `standard-elements/` (headings, code blocks, tables) and `embedded-elements/` (API refs, callouts, recipes)
- `tina/collections/` — TinaCMS collection schemas (docs, API schemas, navigation, settings)
- `tina/templates/markdown-embeds/` — Embeddable content templates (accordion, callout, code-tabs, card-grid, etc.)
- `tina/customFields/` — Custom CMS field components (theme selector, file upload, Monaco editor)
- `src/styles/global.css` — Theme definitions via CSS custom properties (6 themes, light/dark)

## Commands

```bash
pnpm install                    # Install deps (pnpm 9.15.2 required)
pnpm dev                        # Dev server with Turbopack (localhost:3000, CMS at /admin)
pnpm build                      # Production build (TinaCMS + Next.js + Pagefind + sitemap)
pnpm lint                       # Biome linter check
pnpm lint:fix                   # Auto-fix lint issues
pnpm test                       # Playwright E2E tests (Chromium)
pnpm test:ui                    # Playwright interactive UI
pnpm build-local-pagefind       # Rebuild search index locally
npx playwright test tests/e2e/some-test.spec.ts  # Run a single test
pnpm tinacms build --local --skip-cloud-checks   # Validate schema + content offline, no TinaCloud creds needed
```

`tinacms build --local --skip-cloud-checks` is the schema gate: run it after changing anything under `tina/` or bulk-editing content. It fails on any MDX that does not match the collection schema.

### TinaCMS schema changes

After changing a Tina collection, template, or any other schema input, regenerate the committed lockfile:

1. Run `pnpm dev` and wait for `tina/tina-lock.json` to change.
2. Stop the dev server; do not leave it running in the background.
3. Commit `tina/tina-lock.json` with the schema change.
4. Run the schema gate and verify CI. `tinacms build` does not regenerate the lockfile.

## Pull request best practices

- Keep each PR focused. Explain the problem, the change, and how it was validated; link related issues and upstream PRs.
- For UI work, run `pnpm dev` and independently inspect every affected route at desktop and mobile widths. Do not rely only on screenshots or claims supplied by the author.
- Capture before/after screenshots when the change is visual. Upload them to the PR with `gh pr edit <number> --attach './before.png#Before the change' --attach './after.png#After the change'`.
- Attach visual-review evidence or feedback with `gh pr comment <number> --body 'Visual review' --attach './desktop.png#Desktop view' --attach './mobile.png#Mobile view'`.
- Run `pnpm lint`, relevant tests, and the schema gate when `tina/` or content changed. Confirm required CI checks pass before approving.
- Submit the review separately after visual inspection: `gh pr review <number> --approve --body 'LGTM'` or `gh pr review <number> --request-changes --body '<required changes>'`.

## Coding Standards

- Use `@/` path aliases for imports: `@/components`, `@/utils`, `@/app`, `@/tina`, `@/services`, `@/hooks`, `@/styles`, `@/content`, `@/lib`, `@/types`, `@/config`
- Use Biome for formatting: 2-space indent, double quotes, semicolons, trailing commas (ES5)
- No `console.log` — use `noConsole: error`
- No `.forEach()` — use `for...of` or `.map()`
- Self-close empty JSX elements

## Key Patterns

### Fetching TinaCMS data in pages

```typescript
import { fetchTinaData } from "@/services/tina/fetch-tina-data";
import client from "@/tina/__generated__/client";

async function getData(slug: string) {
  return await fetchTinaData(client.queries.docs, slug);
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const data = await getData(slug.join("/"));

  return (
    <TinaClient
      Component={Document}
      props={{ query: data.query, variables: data.variables, data: data.data }}
    />
  );
}
```

### Adding a new embeddable template

1. **Define template** in `tina/templates/markdown-embeds/my-embed.template.tsx`:

```typescript
export const MyEmbedTemplate = {
  name: "myEmbed",
  label: "My Embed",
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "rich-text", name: "body", label: "Body" },
  ],
};
```

2. **Create component** in `src/components/tina-markdown/embedded-elements/my-embed.tsx`:

```typescript
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type TinaMarkdownContent } from "tinacms/dist/rich-text";
import { MarkdownComponentMapping } from "../markdown-component-mapping";

export default function MyEmbed(props: { title: string; body?: TinaMarkdownContent }) {
  return (
    <div data-tina-field={tinaField(props, "title")}>
      <h3>{props.title}</h3>
      <TinaMarkdown content={props.body as TinaMarkdownContent} components={MarkdownComponentMapping} />
    </div>
  );
}
```

3. **Register template** in `tina/collections/docs.tsx` — add to the `templates` array in the `body` rich-text field
4. **Map component** in `src/components/tina-markdown/markdown-component-mapping.tsx`:

```typescript
myEmbed: (props) => <MyEmbed {...props} />,
```

### TinaCMS component conventions

- Use `tinaField(props, "fieldName")` on `data-tina-field` attributes for visual editing
- Render nested rich-text with `<TinaMarkdown content={...} components={MarkdownComponentMapping} />`
- Define variant/config mappings as `const` objects with `as const`

## Environment

Copy `.env.example`. Required: `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`, `NEXT_PUBLIC_TINA_BRANCH` (from app.tina.io). Optional: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_BASE_PATH`.
