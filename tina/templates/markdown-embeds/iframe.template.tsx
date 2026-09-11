export const IframeTemplate = {
  name: "Iframe",
  label: "Iframe",
  ui: {
    defaultItem: {
      height: 450,
    },
  },
  fields: [
    {
      name: "iframeSrc",
      label: "Iframe URL",
      type: "string",
    },
    {
      name: "height",
      label: "Height",
      type: "number",
      description: "The height of the iframe (in px)",
    },
  ],
};

export default IframeTemplate;
