import { DocsLayout, DocsMenu } from "@/app/docs-layout";
import ErrorWrapper from "@/app/error-wrapper";
import { getLocale, getLocaleHome } from "@/utils/locale";
import { withBasePath } from "@/utils/with-base-path";
import { headers } from "next/headers";

export const metadata = {
  title: "Page not found | TinaCMS",
};

export default async function GlobalNotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const locale = getLocale(pathname);

  return (
    <DocsLayout locale={locale}>
      <DocsMenu locale={locale} siblingExists={false}>
        <div className="w-full flex flex-col md:flex-row gap-4 md:p-4 max-w-[2560px] mx-auto">
          <main className="flex-1">
            <ErrorWrapper
              errorConfig={{
                title: "Sorry, Friend!",
                description: "We couldn't find what you were looking for.",
                links: [
                  {
                    linkText: "Return to docs",
                    linkUrl: withBasePath(getLocaleHome(locale)),
                  },
                ],
              }}
            />
          </main>
        </div>
      </DocsMenu>
    </DocsLayout>
  );
}
