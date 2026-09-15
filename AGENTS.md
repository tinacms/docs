# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## About this repo

This is the **TinaCMS documentation site**, served at `tina.io/docs` (and `tina.io/zh/docs`) through a rewrite from the tina.io Next.js app. It is a deployed instance of the [tina-docs](https://github.com/tinacms/tina-docs) starter, not the starter itself:

- Hardcoding tina.io values (URLs, branding, redirects, analytics) is fine here.
- Features only this site needs (tina.io header, `GraphQLCodeBlock`, alias permalinks, zh locale) are built here first. Generic component or template fixes must also be sent to tina-docs in a linked PR so the starter does not drift.
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

## Migration and review checklist

For bulk content migrations and embed conversions:

- Preserve meaning and presentation. Keep literal examples and CLI errors in code fences, retain warning severity, and do not drop links, headings, captions, or media silently.
- Verify every referenced asset exists and renders. If an asset was already dead at the source, remove the embed and explain that decision in the PR.
- Keep component defaults aligned with their Tina template defaults. Changing runtime behavior without changing newly inserted CMS content is incomplete.
- After rebasing or restacking, rerun the schema gate and recheck the affected pages. Conflict resolution can produce valid Git with broken MDX.

For UI or component work:

- Run `pnpm dev` and inspect every affected route at desktop and mobile widths. Include long content, code blocks, tables, and nested embeds where relevant.
- Capture and upload screenshots for changed UI and visual review feedback. Add before/after images when the change is visual.
- Check keyboard interaction and accessible names for new or expanded interactive UI.
- Run `pnpm lint`, relevant tests, and the schema gate when `tina/` or content changed.
- For generic fixes shared with tina-docs, open the linked tina-docs PR before treating this repository's work as complete.

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
