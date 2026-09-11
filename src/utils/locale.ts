export type Locale = "en" | "zh";

export const locales = {
  en: {
    collection: "docs",
    contentDir: "content/docs",
    pathPrefix: "",
    tinaIoDocsPath: "/docs",
    navigationFile: "docs-navigation-bar.json",
  },
  zh: {
    collection: "docsZh",
    contentDir: "content/docs-zh",
    pathPrefix: "/zh",
    tinaIoDocsPath: "/zh/docs",
    navigationFile: "docs-navigation-bar-zh.json",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type DocsCollection = (typeof locales)[Locale]["collection"];

export function getLocale(pathname: string): Locale {
  return pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}

export function getLocaleHome(locale: Locale): string {
  return locales[locale].pathPrefix || "/";
}
