import "@/styles/global.css";
import { TailwindIndicator } from "@/components/ui/tailwind-indicator";
import { ThemeSelector } from "@/components/ui/theme-selector";
import settings from "@/content/settings/config.json";
import client from "@/tina/__generated__/client";
import { GoogleTagManager } from "@next/third-parties/google";
import { ThemeProvider } from "next-themes";
import { Inter, Roboto_Flex } from "next/font/google";

import { TabsLayout } from "@/components/docs/layout/tab-layout";
import type { Locale } from "@/utils/locale";
import { withBasePath } from "@/utils/with-base-path";
import type React from "react";
import { TinaClient } from "./tina-client";

const isDev = process.env.NODE_ENV === "development";

const body = Inter({ subsets: ["latin"], variable: "--body-font" });
const heading = Roboto_Flex({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  variable: "--heading-font",
});

const isThemeSelectorEnabled =
  isDev || process.env.NEXT_PUBLIC_ENABLE_THEME_SELECTION === "true";

const theme = settings.selectedTheme || "default";
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export function DocsLayout({
  locale,
  children = null,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} className={`theme-${theme}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#E6FAF8" />
        <link
          rel="icon"
          type="image/svg+xml"
          href={withBasePath("/favicon.svg")}
        />
      </head>
      <body className={`${body.variable} ${heading.variable}`}>
        {!isDev && gtmId && (
          <GoogleTagManager
            gtmId={gtmId}
            gtmScriptUrl="https://www.googletagmanager.com/gtm.js"
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme={theme}
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {isThemeSelectorEnabled && <ThemeSelector />}
          <Content>{children}</Content>
        </ThemeProvider>
      </body>
    </html>
  );
}

const Content = ({ children }: { children?: React.ReactNode }) => (
  <>
    <TailwindIndicator />
    <div className="font-sans flex min-h-screen flex-col bg-background-color">
      <div className="flex flex-1 flex-col items-center">{children}</div>
    </div>
  </>
);

async function navigationRelativePath(locale: Locale) {
  const { data } = await client.queries.navigationBarLocales();
  const nodes = (data.navigationBarConnection.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node) => node != null);
  const match = nodes.find((node) => (node.locale ?? "en") === locale);
  if (!match) {
    throw new Error(`No navigation-bar document has locale "${locale}"`);
  }
  return match._sys.relativePath;
}

// Renders the tab/nav chrome around a doc page. Called from DocsPage (not DocsLayout)
// because the language switcher's SSR target needs `siblingExists`, which is only known
// once the page has resolved its slug.
export const DocsMenu = async ({
  locale,
  siblingExists,
  children,
}: {
  locale: Locale;
  siblingExists: boolean;
  children?: React.ReactNode;
}) => {
  const navigationData = await client.queries.minimisedNavigationBarFetch({
    relativePath: await navigationRelativePath(locale),
  });

  return (
    <div className="relative flex flex-col w-full pb-2">
      <TinaClient
        props={{
          children,
          siblingExists,
          query: navigationData.query,
          variables: navigationData.variables,
          data: navigationData.data,
        }}
        Component={TabsLayout}
      />
    </div>
  );
};
