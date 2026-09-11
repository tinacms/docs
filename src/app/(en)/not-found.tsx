import { DocsMenu } from "@/app/docs-layout";
import ErrorWrapper from "@/app/error-wrapper";
import type { Locale } from "@/utils/locale";

// A 404 never has a translation sibling to switch to, so siblingExists is
// always false here. Shared by (zh)/not-found.tsx, which calls this with
// locale="zh" so the nav chrome (and the language switcher) match the route.
export async function NotFoundContent({ locale }: { locale: Locale }) {
  return (
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
                  linkUrl: "/",
                },
              ],
            }}
          />
        </main>
      </div>
    </DocsMenu>
  );
}

export default function NotFound() {
  return <NotFoundContent locale="en" />;
}
