import { DocsPage, generateDocsMetadata } from "@/app/docs-page";

export function generateMetadata() {
  return generateDocsMetadata("en", "index");
}

export default function Page() {
  return <DocsPage locale="en" slug="index" />;
}
