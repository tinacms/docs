"use client";

import { DialogTitle } from "@/components/ui/dialog";
import type { Locale } from "@/utils/locale";
import { withBasePath } from "@/utils/with-base-path";
import Image from "next/image";
import { FaChevronRight } from "react-icons/fa";

export const languages = {
  en: { name: "English", nativeName: "English", flag: "/flags/en.png" },
  zh: { name: "Chinese", nativeName: "中文", flag: "/flags/zh.png" },
} as const satisfies Record<Locale, Record<string, string>>;

const titles: Record<Locale, string> = {
  en: "Select your language",
  zh: "选择语言",
};

const localeCodes = Object.keys(languages) as Locale[];

export function LanguageSelect({
  currentLanguage,
  onLanguageSelect,
}: {
  currentLanguage: Locale;
  onLanguageSelect: (locale: Locale) => void;
}) {
  return (
    <div className="px-2 py-4 md:py-6">
      <div className="flex justify-center pb-8">
        <DialogTitle className="m-0 inline-block text-2xl font-semibold text-brand-primary md:text-3xl lg:leading-tight">
          {titles[currentLanguage]}
        </DialogTitle>
      </div>
      <div className="grid gap-3">
        {localeCodes.map((code) => {
          const language = languages[code];
          const isSelected = code === currentLanguage;
          return (
            <div key={code} className="flex w-full justify-center">
              <button
                type="button"
                onClick={() => onLanguageSelect(code)}
                aria-current={isSelected ? "true" : undefined}
                className={`flex w-full max-w-md flex-row items-center justify-between rounded-lg border p-4 shadow transition duration-200 hover:scale-105 hover:bg-neutral-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isSelected
                    ? "border-brand-primary bg-neutral-background-secondary"
                    : "border-neutral-border bg-neutral-background"
                }`}
              >
                <Image
                  src={withBasePath(language.flag)}
                  alt=""
                  width={40}
                  height={40}
                  className="mr-4 size-10 rounded-full"
                />
                <div className="grow text-left">
                  <div className="text-lg font-medium text-neutral-text">
                    {language.name}
                  </div>
                  <div
                    lang={code}
                    className="text-xs text-neutral-text-secondary"
                  >
                    {language.nativeName}
                  </div>
                </div>
                <FaChevronRight
                  className="size-5 shrink-0 text-neutral-text-secondary"
                  aria-hidden="true"
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
