export const ImageAndTextTemplate = {
  name: "ImageAndText",
  label: "Image and Text",
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
      description:
        "The heading text that will be displayed in the collapsed state",
    },
    {
      name: "docText",
      label: "Body Text",
      isBody: true,
      type: "rich-text",
    },
    {
      name: "image",
      label: "Image",
      type: "image",
    },
  ],
};

export default ImageAndTextTemplate;
