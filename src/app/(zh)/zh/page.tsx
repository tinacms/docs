import { DocsPage, generateDocsMetadata } from "@/app/docs-page";

export function generateMetadata() {
  return generateDocsMetadata("zh", "index");
}

export default function Page() {
  return <DocsPage locale="zh" slug="index" />;
}
