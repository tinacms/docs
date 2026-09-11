"use client";

import {
  type Locale,
  getAlternateLocale,
  getLocale,
  getLocaleHome,
} from "@/utils/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { MdLanguage } from "react-icons/md";

const LABELS: Record<Locale, string> = { en: "English", zh: "中文" };

type AlternateDocumentContextValue = {
  url: string | null;
  setUrl: (url: string | null) => void;
};

const AlternateDocumentContext =
  createContext<AlternateDocumentContextValue | null>(null);

export function AlternateDocumentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  return (
    <AlternateDocumentContext.Provider value={{ url, setUrl }}>
      {children}
    </AlternateDocumentContext.Provider>
  );
}

export function AlternateDocument({ url }: { url: string | null }) {
  const context = useContext(AlternateDocumentContext);
  const setUrl = context?.setUrl;
  useEffect(() => {
    setUrl?.(url);
    return () => setUrl?.(null);
  }, [setUrl, url]);
  return null;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; max-age=31536000; path=/; SameSite=Lax`;
}

export function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const target = getAlternateLocale(getLocale(pathname));
  const alternateUrl = useContext(AlternateDocumentContext)?.url;
  const href = alternateUrl ?? getLocaleHome(target);

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
