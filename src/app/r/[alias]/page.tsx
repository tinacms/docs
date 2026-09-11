import { readFile } from "node:fs/promises";
import client from "@/tina/__generated__/client";
import { getUrl } from "@/utils/get-url";
import glob from "fast-glob";
import matter from "gray-matter";
import { notFound, redirect } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const files = await glob("content/docs/**/*.mdx");
  const params: { alias: string }[] = [];

  for (const file of files) {
    const { data } = matter(await readFile(file, "utf8"));
    if (typeof data.alias === "string" && data.alias) {
      params.push({ alias: data.alias });
    }
  }

  return params;
}

export default async function AliasRedirect({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const { data } = await client.queries.docsConnection({
    filter: { alias: { eq: alias } },
  });
  const doc = data.docsConnection.edges?.[0]?.node;

  if (!doc) notFound();

  redirect(getUrl(doc._sys.path));
}
