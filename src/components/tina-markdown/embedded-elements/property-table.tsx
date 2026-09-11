import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type TinaMarkdownContent } from "tinacms/dist/rich-text";
import MarkdownComponentMapping from "../markdown-component-mapping";

export interface PropertyTableProperty {
  groupName?: string;
  name?: string;
  description?: TinaMarkdownContent;
  type?: string;
  default?: string;
  required?: boolean;
  experimental?: boolean;
}

interface PropertyTableProps {
  title?: string;
  property?: PropertyTableProperty[];
}

type Segment = {
  groupName: string | null;
  properties: PropertyTableProperty[];
};

const segmentByAdjacentGroup = (
  properties: PropertyTableProperty[]
): Segment[] => {
  const segments: Segment[] = [];
  for (const property of properties) {
    const groupName = property.groupName || null;
    const last = segments.at(-1);
    if (groupName && last?.groupName === groupName) {
      last.properties.push(property);
    } else {
      segments.push({ groupName, properties: [property] });
    }
  }
  return segments;
};

const Divider = () => (
  <hr className="h-0.25 w-[90%] mx-auto bg-neutral-border rounded-lg border-none" />
);

const PropertyItem = ({ property }: { property: PropertyTableProperty }) => (
  <div className="py-4 px-6">
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
      <div className="w-full md:w-1/3">
        <div className="mb-1 flex gap-2">
          {property.required && (
            <span className="text-amber-600 font-medium text-xs">REQUIRED</span>
          )}
          {property.experimental && (
            <span className="bg-gradient-to-r from-brand-secondary-gradient-start to-brand-secondary-gradient-end bg-clip-text text-transparent font-medium text-xs">
              EXPERIMENTAL
            </span>
          )}
        </div>
        <div
          className="font-heading text-lg text-brand-primary break-normal max-w-full inline-block"
          data-tina-field={tinaField(property, "name")}
        >
          {property.name?.replace(/([A-Z])/g, "​$1")}
        </div>
        <div
          className="text-neutral-text-secondary text-sm"
          data-tina-field={tinaField(property, "type")}
        >
          {property.type}
        </div>
      </div>
      <div className="w-full md:w-2/3 text-sm text-neutral-text">
        <div data-tina-field={tinaField(property, "description")}>
          <TinaMarkdown
            content={property.description as TinaMarkdownContent}
            components={MarkdownComponentMapping}
          />
        </div>
        {property.default && (
          <div
            className="mt-1 text-neutral-text-secondary"
            data-tina-field={tinaField(property, "default")}
          >
            Default is{" "}
            <code className="rounded border border-neutral-border bg-neutral-surface px-1 py-0.5 text-brand-primary">
              {property.default}
            </code>
            .
          </div>
        )}
      </div>
    </div>
  </div>
);

const PropertyGroup = ({
  groupName,
  properties,
}: {
  groupName: string;
  properties: PropertyTableProperty[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const required = properties.some((property) => property.required);

  return (
    <div className="my-4 mx-4 overflow-hidden rounded-lg border border-neutral-border bg-neutral-background-secondary">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors hover:bg-neutral-background-tertiary"
        data-tina-field={tinaField(properties[0], "groupName")}
      >
        <div>
          {required && (
            <p className="text-amber-600 font-medium text-xs">REQUIRED</p>
          )}
          <h3 className="font-heading text-lg text-brand-primary">
            {groupName}
          </h3>
        </div>
        <ChevronRightIcon
          className={`size-5 shrink-0 text-neutral-text-secondary transition-transform group-hover:text-brand-primary ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-2 bg-neutral-background">
          {properties.map((property, index) => (
            <Fragment key={`${index}-${property.name}`}>
              {index !== 0 && <Divider />}
              <div className="mx-2 border-l-2 border-brand-primary">
                <PropertyItem property={property} />
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PropertyTable(props: PropertyTableProps) {
  const { title, property = [] } = props;
  const segments = segmentByAdjacentGroup(property);
  const hasRequired = property.some((item) => item.required);

  return (
    <div
      className={`bg-neutral-background rounded-lg shadow-lg my-6 pb-2 border border-neutral-border ${
        title ? "pt-6" : "pt-2"
      }`}
      data-testid="property-table"
    >
      {title && (
        <h2
          className="font-heading text-2xl text-neutral-text px-6 mb-4"
          data-tina-field={tinaField(props, "title")}
        >
          {title}
        </h2>
      )}

      {segments.map((segment, index) => {
        const previous = segments[index - 1];
        const needsDivider =
          index !== 0 && !segment.groupName && !previous?.groupName;
        return (
          <Fragment key={`${index}-${segment.groupName ?? "single"}`}>
            {needsDivider && <Divider />}
            {segment.groupName ? (
              <PropertyGroup
                groupName={segment.groupName}
                properties={segment.properties}
              />
            ) : (
              <PropertyItem property={segment.properties[0]} />
            )}
          </Fragment>
        );
      })}

      {hasRequired && (
        <div className="mx-6 my-2 p-4 bg-neutral-background-secondary border-neutral-border border rounded-md">
          <p className="text-sm text-neutral-text">
            All properties marked as{" "}
            <span className="text-amber-600 font-medium">REQUIRED</span> must be
            specified for the field to work properly.
          </p>
        </div>
      )}
    </div>
  );
}
