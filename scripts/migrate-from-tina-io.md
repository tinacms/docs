# Migration report: tina.io docs to this instance

Output of `pnpm tsx scripts/migrate-from-tina-io.ts --source ../tina.io` run on 2026-09-11 against tina.io commit `bd6eebf1`. The generated content and media were not committed with this report; the real import lands once the schema, embed templates, and `docsZh` collection are on main. Re-run the script to reproduce these numbers.

```
Migration from tina.io
Source: /Users/josh/Desktop/Tina/tina.io

Files
  en: 229 in, 229 out (content/docs)
  zh: 189 in, 189 out (content/docs-zh)

Embeds rewritten
  WarningCallout -> Callout variant="warning": 129
  Youtube -> youtube: 63
  apiReference -> propertyTable: 30
  scrollBasedShowcase -> scrollShowcase: 5

Embed tags in output (allowed set)
  Callout: 129
  youtube: 63
  ImageAndText: 46
  GraphQLCodeBlock: 44
  propertyTable: 30
  WebmEmbed: 23
  scrollShowcase: 5
  cardGrid: 3
  accordionBlock: 2

Unmapped tags (0)

Empty next/previous stripped
  previous: 138
  next: 135

Frontmatter keys dropped besides id
  consumes: 18 file(s)
    content/docs/contributing/releasing.mdx
    content/docs/contributing/setting-up.mdx
    content/docs/reference/toolkit/fields/blocks.mdx
    content/docs/reference/toolkit/fields/color.mdx
    content/docs/reference/toolkit/fields/date.mdx
    content/docs/reference/toolkit/fields/group-list.mdx
    content/docs/reference/toolkit/fields/group.mdx
    content/docs/reference/toolkit/fields/html.mdx
    content/docs/reference/toolkit/fields/image.mdx
    content/docs/reference/toolkit/fields/list.mdx
    content/docs/reference/toolkit/fields/number.mdx
    content/docs/reference/toolkit/fields/radio-group.mdx
    content/docs/reference/toolkit/fields/select.mdx
    content/docs/reference/toolkit/fields/tags.mdx
    content/docs/reference/toolkit/fields/text.mdx
    content/docs/reference/toolkit/fields/textarea.mdx
    content/docs/reference/toolkit/fields/toggle.mdx
    content/docs-zh/reference/toolkit/fields/color.mdx
  prev: 2 file(s)
    content/docs/frameworks/other.mdx
    content/docs-zh/frameworks/other.mdx

Media (167 copied, 17 missing)
  MISSING /gif/Untitled video - Made with Clipchamp (8).gif (content/docs/beginner-tutorials/display-content.mdx:79)
  MISSING /img/tutorials/SCR-20250319-jkaq.png (content/docs/beginner-tutorials/install-tinacms.mdx:31)
  MISSING /gif/Screen%20Recording%202025-03-19%20at%2011.08.18%E2%80%AFam.gif (content/docs/beginner-tutorials/live-editing.mdx:17)
  MISSING /gif/Screen Recording 2025-03-19 at 11.08.18 am.gif (content/docs/beginner-tutorials/loading-content.mdx:89)
  MISSING /img/tutorials/SCR-20250319-kexg.png (content/docs/beginner-tutorials/new-field.mdx:98)
  MISSING /gif/Screen Recording 2025-03-19 at 11.35.03 am.gif (content/docs/beginner-tutorials/render-templates.mdx:68)
  MISSING /gif/Untitled video - Made with Clipchamp (9).gif (content/docs/beginner-tutorials/routing.mdx:75)
  MISSING /img/docs/faq/renaming-copilot-branches.gif (content/docs/faq.mdx:243)
  MISSING /img/docs/content-audit-github-actions/audit-issue-description.png (content/docs/guides/content-auditing-github-actions.mdx:16)
  MISSING /img/docs/content-audit-github-actions/workflow-settings-github.png (content/docs/guides/content-auditing-github-actions.mdx:72)
  MISSING /img/docs/content-audit-github-actions/github-models-settings.png (content/docs/guides/content-auditing-github-actions.mdx:79)
  MISSING /img/docs/content-audit-github-actions/running-github-action.gif (content/docs/guides/content-auditing-github-actions.mdx:182)
  MISSING /img/docs/content-audit-github-actions/issues-audit-action.png (content/docs/guides/content-auditing-github-actions.mdx:184)
  MISSING /img/docs/content-audit-github-actions/content-audit-pr.png (content/docs/guides/content-auditing-github-actions.mdx:187)
  MISSING /img/docs/guides-internationalization/Screenshot%202025-04-14%20102942.png (content/docs/guides/internationalization.mdx:165)
  MISSING /img/docs/SCR-20250310-jybh.png (content/docs/reaching-out.mdx:14)
  MISSING /img/docs/SCR-20250310-jylo.png (content/docs/reaching-out.mdx:16)

Redirects (97 written, 2 outside /docs with basePath: false)
  /docs/nextjs/bootstrapping -> /guides/nextjs/git/getting-started
  /docs/nextjs/creating-forms -> /guides/nextjs/git/creating-git-forms

Navigation items
  content/navigation-bar/docs-navigation-bar.json: Docs 128, Learn 50, title overrides 105
  content/navigation-bar/docs-navigation-bar-zh.json: 文档 99, 学习 38, title overrides 106

Dangling references (0)

Validation gate
  tinacms build passed
```

## Reading the numbers

- Line numbers point at the tina.io source file, before `id` is stripped from the frontmatter.
- `content/docs/beginner-tutorials/.gitkeep.mdx` (0 bytes) is excluded by the glob, which is why 229 EN files are listed rather than the 230 on disk.
- Media references are copied to `public/` at their tina.io path and left as written in the MDX; every renderer in this instance prefixes `NEXT_PUBLIC_BASE_PATH` itself. No tina.io docs page sets `seo.ogImage`, so nothing needed special handling there.
- Every missing media file is already a 404 on tina.io; nothing that renders today is lost. All 17 are referenced from EN pages and their ZH mirrors.
- `youtubeEmbed`, `imageEmbed`, and `emailEmbed` only appear inside fenced code blocks (a guide showing example templates), so they are correctly left alone and do not show up as rewrites or unmapped tags.
- Empty `next: ''` and `previous: ''` values are dropped rather than written as empty references.
- The two redirects whose destination is outside `/docs` are written with `basePath: false` and their source and destination unchanged, since Next then matches and redirects without the base path.
- 211 tina.io navigation labels differ from the document title (numbering, stars, shortened names, ZH punctuation). Those are carried as a `title` override on the navigation item; the rest fall back to the document title.
- ZH tabs are titled 文档 and 学习, matching tina.io's ZH tab labels.
- The validation gate passed on the pre-Task-1-to-3 schema: `tinacms build --local` does not parse rich-text bodies against templates, ignores `content/docs-zh` while no collection claims it, and accepts the unknown `locale` key on the ZH navigation document. Treat the script's own checks as the authority until the schema lands.
