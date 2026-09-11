import { DocsLayout } from "@/app/docs-layout";
import type React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout locale="en">{children}</DocsLayout>;
}
