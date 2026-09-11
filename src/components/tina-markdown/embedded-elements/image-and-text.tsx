import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type TinaMarkdownContent } from "tinacms/dist/rich-text";
import MarkdownComponentMapping from "../markdown-component-mapping";
import ImageEmbed from "./image-embed";

interface ImageAndTextProps {
  heading?: string;
  docText?: TinaMarkdownContent;
  image?: string;
}

export default function ImageAndText(props: ImageAndTextProps) {
  const { heading, docText, image } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`mb-4 max-w-full overflow-hidden rounded-lg bg-neutral-background border border-neutral-border shadow-md transition-[width] duration-500 ease-in-out ${
        isExpanded ? "w-full" : "w-80"
      }`}
      data-testid="image-and-text"
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        data-tina-field={tinaField(props, "heading")}
      >
        <span className="font-heading text-base text-neutral-text">
          {heading || "Click to expand"}
        </span>
        {isExpanded ? (
          <MinusIcon className="size-4 shrink-0 text-neutral-text" />
        ) : (
          <PlusIcon className="size-4 shrink-0 text-neutral-text" />
        )}
      </button>
      <div
        className={`grid gap-4 border-t border-neutral-border transition-all duration-500 ease-in-out ${
          isExpanded
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 overflow-hidden opacity-0 border-t-0"
        } ${image ? "sm:grid-cols-2" : ""}`}
      >
        <div
          className="px-4 py-2"
          data-tina-field={tinaField(props, "docText")}
        >
          <TinaMarkdown
            content={docText as TinaMarkdownContent}
            components={MarkdownComponentMapping}
          />
        </div>
        {image && (
          <div className="px-4" data-tina-field={tinaField(props, "image")}>
            <ImageEmbed image={{ src: image, alt: heading }} />
          </div>
        )}
      </div>
    </div>
  );
}
