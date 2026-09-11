import { DocsMenu } from "@/app/docs-layout";
import { TinaClient } from "@/app/tina-client";
import Document from "@/components/docs/document";
import settings from "@/content/siteConfig.json";
import { fetchTinaData } from "@/services/tina/fetch-tina-data";
import { GitHubMetadataProvider } from "@/src/components/page-metadata/github-metadata-context";
import GithubConfig from "@/src/utils/github-client";
import client from "@/tina/__generated__/client";
import { getTableOfContents } from "@/utils/docs";
import { type Locale, getAlternateLocale, locales } from "@/utils/locale";
import { getSeo } from "@/utils/metadata/getSeo";
import type { Metadata } from "next";
import { cache } from "react";

const siteUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : settings.siteUrl;

const fetchDoc = cache(async (locale: Locale, slug: string) => {
  if (locale === "zh") {
    const result = await fetchTinaData(client.queries.docsZh, slug);
    return { ...result, doc: result.data.docsZh };
  }
  const result = await fetchTinaData(client.queries.docs, slug);
  return { ...result, doc: result.data.docs };
});

const docExists = cache(async (locale: Locale, slug: string) => {
  const query = locale === "zh" ? client.queries.docsZh : client.queries.docs;
  try {
    await query({ relativePath: `${slug}.mdx` });
    return true;
  } catch {
    return false;
  }
});

async function listDocPaths(locale: Locale) {
  const paths: string[] = [];
  let after: string | undefined;
  do {
    const page =
      locale === "zh"
        ? (await client.queries.docsZhConnection({ after })).data
            .docsZhConnection
        : (await client.queries.docsConnection({ after })).data.docsConnection;
    for (const edge of page.edges ?? []) {
      if (edge?.node) {
        paths.push(edge.node._sys.path);
      }
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : undefined;
  } while (after);
  return paths;
}

function tinaIoUrl(locale: Locale, slug: string) {
  const path = slug === "index" ? "" : `/${slug}`;
  return `${siteUrl}${locales[locale].tinaIoDocsPath}${path}`;
}

export async function generateDocsStaticParams(locale: Locale) {
  const prefix = `${locales[locale].contentDir}/`;
  try {
    const paths = await listDocPaths(locale);
    return paths
      .filter((path) => path.startsWith(prefix))
      .map((path) => ({
        slug: path
          .slice(prefix.length)
          .replace(/\.mdx$/, "")
          .split("/"),
      }));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: surface backend failures during static generation
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

export async function generateDocsMetadata(
  locale: Locale,
  slug: string
): Promise<Metadata> {
  const { doc } = await fetchDoc(locale, slug);
  const seo = getSeo(
    {
      ...doc.seo,
      canonicalUrl: doc.seo?.canonicalUrl || tinaIoUrl(locale, slug),
    },
    { pageTitle: doc.title, body: doc.body }
  );

  const alternate = getAlternateLocale(locale);
  if (!(await docExists(alternate, slug))) {
    return seo;
  }
  return {
    ...seo,
    alternates: {
      ...seo.alternates,
      languages: {
        en: tinaIoUrl("en", slug),
        zh: tinaIoUrl("zh", slug),
      },
    },
  };
}

export async function DocsPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const { doc, ...data } = await fetchDoc(locale, slug);
  const pageTableOfContents = getTableOfContents(doc.body);

  const githubMetadata = GithubConfig.IsConfigured
    ? await GithubConfig.fetchMetadata(doc.id)
    : null;

  const siblingExists = await docExists(getAlternateLocale(locale), slug);

  return (
    <DocsMenu locale={locale} siblingExists={siblingExists}>
      <GitHubMetadataProvider data={githubMetadata}>
        <TinaClient
          Component={Document}
          props={{
            query: data.query,
            variables: data.variables,
            data: data.data,
            collection: locales[locale].collection,
            hasGithubConfig: GithubConfig.IsConfigured,
            pageTableOfContents,
            formId: doc.id,
          }}
        />
      </GitHubMetadataProvider>
    </DocsMenu>
  );
}
