import {
  DocsPage,
  generateDocsMetadata,
  generateDocsStaticParams,
} from "@/app/docs-page";

type Params = Promise<{ slug: string[] }>;

export function generateStaticParams() {
  return generateDocsStaticParams("en");
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  return generateDocsMetadata("en", slug.join("/"));
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <DocsPage locale="en" slug={slug.join("/")} />;
}
