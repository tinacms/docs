import { docsCollection } from "./docs";

export const docsZhCollection = {
  ...docsCollection,
  name: "docsZh",
  label: "Docs (中文)",
  path: "content/docs-zh",
  ui: {
    ...docsCollection.ui,
    router: ({ document }) => {
      if (document._sys.filename === "index") {
        return "/zh";
      }
      const slug = document._sys.breadcrumbs.join("/");
      return `/zh/${slug}`;
    },
  },
};

export default docsZhCollection;
