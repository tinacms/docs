import type { Template } from "tinacms";
import { titleCase } from "title-case";

export const itemTemplate: Template = {
  label: "Item",
  name: "item",
  ui: {
    itemProps: (item) => {
      return {
        label: `🔗 ${titleCase(
          item?.slug?.split("/").at(-1).split(".").at(0).replaceAll("-", " ") ??
            "Unnamed Menu Item"
        )}`,
      };
    },
  },
  fields: [
    {
      name: "slug",
      label: "Page",
      type: "reference",
      collections: ["docs", "docsZh"],
    },
    {
      name: "title",
      label: "Title override",
      type: "string",
    },
  ],
};

export const submenusLabel: Pick<Template, "label" | "name" | "ui"> = {
  label: "Submenu",
  name: "items",
  ui: {
    itemProps: (item) => ({
      label: `🗂️ ${item?.title ?? "Unnamed Menu Group"}`,
    }),
  },
};
