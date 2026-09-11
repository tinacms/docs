export const SummaryTabTemplate = {
  name: "SummaryTab",
  label: "Summary Tab",
  ui: {
    defaultItem: {
      heading: "Click to expand",
    },
  },
  fields: [
    {
      name: "heading",
      label: "Heading",
      type: "string",
    },
    {
      name: "text",
      label: "Text",
      isBody: true,
      type: "rich-text",
    },
  ],
};

export default SummaryTabTemplate;
