import { MobileNavSidebar } from "@/components/navigation/mobile-navigation-sidebar";
import * as Tabs from "@radix-ui/react-tabs";
import type React from "react";
import { Search } from "../../search-docs/search";
import LightDarkSwitch from "../../ui/light-dark-switch";
import { CtaButton } from "./cta-button";
import { LanguageSwitcher } from "./language-switcher";
import { NavbarLogo } from "./navbar-logo";

export const TopNav = ({
  tabs,
  navigationDocsData,
  siblingExists,
}: {
  tabs: { label: string; content: any }[];
  navigationDocsData: any;
  siblingExists: boolean;
}) => {
  const ctaButtons = navigationDocsData?.ctaButtons;
  const hasButtons = Boolean(ctaButtons?.button1 || ctaButtons?.button2);

  return (
    <div className="border border-neutral-border/50 mb-2 md:mb-4 w-full lg:px-8 py-1 dark:bg-glass-gradient-end dark:border-b dark:border-neutral-border-subtle/60 shadow-md/5">
      <div className="max-w-[2560px] mx-auto flex items-center justify-between gap-4 lg:gap-6 lg:py-0 py-2">
        <div className="flex">
          <NavbarLogo navigationDocsData={[navigationDocsData]} />
          <Tabs.List className="lg:flex hidden">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.label}
                value={tab.label}
                className="px-1 text-lg relative text-brand-primary-contrast mx-4 focus:text-brand-secondary-hover cursor-pointer font-semibold data-[state=active]:text-brand-primary-text after:content-[''] after:absolute after:bottom-1.5 after:left-0 after:h-0.25 after:bg-brand-primary-text after:transition-all after:duration-300 after:ease-out data-[state=active]:after:w-full after:w-0"
              >
                {tab.label || "Untitled Tab"}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        <div className="flex-1 min-w-0 flex justify-center">
          <Search />
        </div>
        <div className="flex items-center gap-4">
          {hasButtons && (
            <div className="hidden lg:flex gap-2">
              <CtaButton button={ctaButtons.button1} />
              <CtaButton button={ctaButtons.button2} />
            </div>
          )}
          <LanguageSwitcher siblingExists={siblingExists} />
          <MobileNavSidebar tocData={tabs} ctaButtons={ctaButtons} />
          <div className="w-full hidden lg:flex justify-end">
            <LightDarkSwitch />
          </div>
        </div>
      </div>
    </div>
  );
};
