import { AliasInput } from "@/tina/customFields/alias-input";
import { CmsUsageWarning } from "@/tina/customFields/cms-usage-warning";
import AccordionTemplate, {
  AccordionBlockTemplate,
} from "@/tina/templates/markdown-embeds/accordion.template";
import { ApiReferenceTemplate } from "@/tina/templates/markdown-embeds/api-reference.template";
import CalloutTemplate from "@/tina/templates/markdown-embeds/callout.template";
import CardGridTemplate from "@/tina/templates/markdown-embeds/card-grid.template";
import CodeTabsTemplate from "@/tina/templates/markdown-embeds/code-tabs.template";
import { FileStructureTemplate } from "@/tina/templates/markdown-embeds/file-structure.template";
import GraphQLCodeBlockTemplate from "@/tina/templates/markdown-embeds/graphql-code-block.template";
import IframeTemplate from "@/tina/templates/markdown-embeds/iframe.template";
import ImageAndTextTemplate from "@/tina/templates/markdown-embeds/image-and-text.template";
import ImageEmbedTemplate from "@/tina/templates/markdown-embeds/image-embed.template";
import PropertyTableTemplate from "@/tina/templates/markdown-embeds/property-table.template";
import RecipeTemplate from "@/tina/templates/markdown-embeds/recipe.template";
import ScrollShowcaseTemplate from "@/tina/templates/markdown-embeds/scroll-showcase.template";
import SummaryTabTemplate from "@/tina/templates/markdown-embeds/summary-tab.template";
import { TypeDefinitionTemplate } from "@/tina/templates/markdown-embeds/type-definition.template";
import WebmEmbedTemplate from "@/tina/templates/markdown-embeds/webm-embed.template";
import YoutubeTemplate from "@/tina/templates/markdown-embeds/youtube.template";
import type { Template } from "tinacms";
import SeoInformation from "./seo-information";

export function docsFields(collection: string) {
  return [
    {
      name: "cmsUsageWarning",
      label: "CMS Usage Warning",
      type: "string",
      ui: {
        component: CmsUsageWarning,
      },
    },
    SeoInformation,
    {
      name: "title",
      label: "Title",
      type: "string",
      isTitle: true,
      required: true,
    },
    {
      name: "alias",
      label: "Alias",
      type: "string",
      description:
        "Stable permalink served at /docs/r/<alias>, so links from code and external sites survive a slug or location change.",
      ui: {
        component: AliasInput,
      },
    },
    {
      type: "string",
      name: "last_edited",
      label: "Last Edited",
      ui: {
        component: "hidden",
      },
    },
    {
      type: "boolean",
      name: "auto_generated",
      label: "Auto Generated",
      description: "Indicates if this document was automatically generated",
      ui: {
        component: "hidden",
      },
    },
    {
      type: "boolean",
      name: "tocIsHidden",
      label: "Hide Table of Contents",
      description:
        "Hide the Table of Contents on this page and expand the content window.",
    },
    {
      name: "next",
      label: "Next page",
      type: "reference",
      collections: [collection],
    },
    {
      name: "previous",
      label: "Previous page",
      type: "reference",
      collections: [collection],
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
      templates: [
        ScrollShowcaseTemplate as Template,
        CardGridTemplate as Template,
        RecipeTemplate as Template,
        AccordionTemplate as Template,
        AccordionBlockTemplate as Template,
        ApiReferenceTemplate as Template,
        YoutubeTemplate as Template,
        CodeTabsTemplate as Template,
        CalloutTemplate as Template,
        TypeDefinitionTemplate as Template,
        FileStructureTemplate as unknown as Template,
        ImageEmbedTemplate as Template,
        GraphQLCodeBlockTemplate as Template,
        WebmEmbedTemplate as Template,
        ImageAndTextTemplate as Template,
        IframeTemplate as Template,
        SummaryTabTemplate as Template,
        PropertyTableTemplate as Template,
      ],
    },
  ];
}

export const docsCollection = {
  name: "docs",
  label: "Docs",
  path: "content/docs",
  format: "mdx",
  ui: {
    beforeSubmit: async ({ values }) => {
      return {
        ...values,
        last_edited: new Date().toISOString(),
        auto_generated: false,
      };
    },
    router: ({ document }) => {
      if (document._sys.filename === "index") {
        return "/";
      }
      const slug = document._sys.breadcrumbs.join("/");
      return `/${slug}`;
    },
    filename: {
      slugify: (values) => {
        return (
          values?.title
            ?.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and dashes
            .replace(/\s+/g, "-") // Replace spaces with dashes
            .replace(/-+/g, "-") // Replace multiple dashes with single dash
            .replace(/^-|-$/g, "") || // Remove leading/trailing dashes
          ""
        );
      },
    },
  },
  fields: docsFields("docs"),
};

export default docsCollection;
