"use client";

import {
  type Locale,
  getAlternateLocale,
  getAlternateLocalePath,
  getLocale,
  getLocaleHome,
} from "@/utils/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdLanguage } from "react-icons/md";

const LABELS: Record<Locale, string> = { en: "English", zh: "中文" };

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; max-age=31536000; path=/; SameSite=Lax`;
}

// `siblingExists` is resolved server-side (docs-page.tsx already awaits it to render
// the page) so the switcher's href is correct on first paint, with no client refetch.
export function LanguageSwitcher({
  siblingExists,
}: { siblingExists: boolean }) {
  const pathname = usePathname() ?? "/";
  const target = getAlternateLocale(getLocale(pathname));
  const href = siblingExists
    ? getAlternateLocalePath(pathname)
    : getLocaleHome(target);

  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      onClick={() => setLocaleCookie(target)}
      data-testid="language-switcher"
      className="flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium text-brand-secondary-contrast transition-colors hover:bg-neutral-background-secondary hover:text-brand-primary"
    >
      <MdLanguage className="size-5" aria-hidden="true" />
      {LABELS[target]}
    </Link>
  );
}
