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
  exists: boolean | null;
  setExists: (exists: boolean | null) => void;
};

const AlternateDocumentContext =
  createContext<AlternateDocumentContextValue | null>(null);

export function AlternateDocumentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [exists, setExists] = useState<boolean | null>(null);
  return (
    <AlternateDocumentContext.Provider value={{ exists, setExists }}>
      {children}
    </AlternateDocumentContext.Provider>
  );
}

export function AlternateDocument({ exists }: { exists: boolean }) {
  const context = useContext(AlternateDocumentContext);
  const setExists = context?.setExists;
  useEffect(() => {
    setExists?.(exists);
    return () => setExists?.(null);
  }, [setExists, exists]);
  return null;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; max-age=31536000; path=/; SameSite=Lax`;
}

export function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const target = getAlternateLocale(getLocale(pathname));
  const siblingExists = useContext(AlternateDocumentContext)?.exists;
  const href =
    siblingExists === false
      ? getLocaleHome(target)
      : getAlternateLocalePath(pathname);

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
