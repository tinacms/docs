"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  type Locale,
  getAlternateLocalePath,
  getLocale,
  getLocaleHome,
} from "@/utils/locale";
import { withBasePath } from "@/utils/with-base-path";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSelect, languages } from "./language-select";

function saveLocaleToCookie(locale: Locale) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `NEXT_LOCALE=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// `siblingExists` is resolved server-side (docs-page.tsx already awaits it to render
// the page) so the switch target is known on first paint, with no client refetch.
export function LanguageSwitcher({
  siblingExists,
}: { siblingExists: boolean }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = getLocale(pathname);

  const handleLanguageSelect = (locale: Locale) => {
    setOpen(false);
    if (locale === current) return;
    saveLocaleToCookie(locale);
    router.push(
      siblingExists ? getAlternateLocalePath(pathname) : getLocaleHome(locale)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Change language (${languages[current].name})`}
          data-testid="language-switcher"
          className="shrink-0 cursor-pointer rounded-full outline-none hover:animate-jelly focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Image
            src={withBasePath(languages[current].flag)}
            alt=""
            width={32}
            height={32}
            className="size-8 max-w-none rounded-full object-cover"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <LanguageSelect
          currentLanguage={current}
          onLanguageSelect={handleLanguageSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
