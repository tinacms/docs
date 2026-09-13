import { Bars3Icon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MdArrowDropDown, MdClose } from "react-icons/md";
import { CtaButton, type CtaButtons } from "../docs/layout/cta-button";
import { findTabWithPath } from "../docs/layout/utils";
import {
  ApiNavigationItems,
  DocsNavigationItems,
} from "./navigation-items/index";

export const NavigationToggle = ({ onToggle }: { onToggle: () => void }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Open navigation"
      data-testid="mobile-nav-toggle"
      className="mr-4 md:mr-6 lg:hidden cursor-pointer"
    >
      <Bars3Icon className="size-9 text-brand-secondary-contrast" />
    </button>
  );
};

export const NavigationDropdownContent = ({
  tocData,
  ctaButtons,
  onClose,
}: {
  tocData: any;
  ctaButtons: CtaButtons;
  onClose: () => void;
}) => {
  const pathname = usePathname();
  const path = pathname || "";

  const [selectedValue, setSelectedValue] = useState(
    findTabWithPath(tocData, path)
  );
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const options = tocData?.map((option: any) => ({
    value: option.label,
    label: option.label,
    content: option.content.items,
    __typename: option.__typename,
  }));

  // Update selected value when pathname changes
  useEffect(() => {
    const newSelectedValue = findTabWithPath(tocData, path);
    setSelectedValue(newSelectedValue);
  }, [path, tocData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-10 lg:hidden"
      />

      <div className="max-w-96 fixed top-0 right-0 z-20 h-dvh w-[75%] flex flex-col bg-neutral-background border-l border-neutral-border-subtle p-6 shadow-xl lg:hidden">
        <div className="flex justify-end mb-4">
          <MdClose
            onClick={onClose}
            className="size-11 text-brand-secondary-contrast cursor-pointer"
          />
        </div>

        <div className="relative w-full mb-4" ref={dropdownRef}>
          <button
            type="button"
            className="w-full p-2 px-4 rounded-lg bg-neutral-background-primary border border-neutral-border-subtle flex items-center justify-between focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>
              {options.find((opt) => opt.value === selectedValue)?.label}
            </span>
            <MdArrowDropDown
              className={`size-6 text-brand-secondary-dark-dark transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-30 w-full mt-1 bg-neutral-background border border-neutral-border-subtle rounded-lg shadow-lg">
              {options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`w-full p-2 px-4 text-left  first:rounded-t-lg last:rounded-b-lg ${
                    selectedValue === option.value
                      ? "bg-neutral-background-secondary text-brand-secondary"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedValue(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {options.find((opt) => opt.value === selectedValue)?.__typename ===
          "NavigationBarTabsApiTab" ? (
            <ApiNavigationItems
              navItems={
                options.find((opt) => opt.value === selectedValue)?.content ||
                []
              }
              __typename={
                options.find((opt) => opt.value === selectedValue)
                  ?.__typename || ""
              }
              onNavigate={onClose}
            />
          ) : (
            <DocsNavigationItems
              navItems={
                options.find((opt) => opt.value === selectedValue)?.content ||
                []
              }
              __typename={
                options.find((opt) => opt.value === selectedValue)
                  ?.__typename || ""
              }
              onNavigate={onClose}
            />
          )}
        </div>

        {(ctaButtons?.button1 || ctaButtons?.button2) && (
          <div
            className="flex flex-col gap-2 pt-4 border-t border-neutral-border-subtle"
            data-testid="mobile-nav-ctas"
          >
            <CtaButton
              button={ctaButtons.button1}
              className="text-center"
              onClick={onClose}
            />
            <CtaButton
              button={ctaButtons.button2}
              className="text-center"
              onClick={onClose}
            />
          </div>
        )}
      </div>
    </>
  );
};
