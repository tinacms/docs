import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type TinaMarkdownContent } from "tinacms/dist/rich-text";
import MarkdownComponentMapping from "../markdown-component-mapping";

interface SummaryTabProps {
  heading?: string;
  text?: TinaMarkdownContent;
}

export default function SummaryTab(props: SummaryTabProps) {
  const { heading, text } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="my-4 border-y border-neutral-border"
      data-testid="summary-tab"
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left"
        onClick={() => setIsOpen(!isOpen)}
        data-tina-field={tinaField(props, "heading")}
      >
        <span className="font-heading text-lg text-neutral-text">
          {heading}
        </span>
        {isOpen ? (
          <MinusIcon className="size-4 shrink-0 text-neutral-text" />
        ) : (
          <PlusIcon className="size-4 shrink-0 text-neutral-text" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3" data-tina-field={tinaField(props, "text")}>
          <TinaMarkdown
            content={text as TinaMarkdownContent}
            components={MarkdownComponentMapping}
          />
        </div>
      )}
    </div>
  );
}
