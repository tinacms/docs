import {
  DocsPage,
  generateDocsMetadata,
  generateDocsStaticParams,
} from "@/app/docs-page";

type Params = Promise<{ slug: string[] }>;

export function generateStaticParams() {
  return generateDocsStaticParams("zh");
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  return generateDocsMetadata("zh", slug.join("/"));
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <DocsPage locale="zh" slug={slug.join("/")} />;
}
