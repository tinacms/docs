export const WebmEmbedTemplate = {
  name: "WebmEmbed",
  label: "Webm Embed",
  ui: {
    defaultItem: {
      width: "100%",
    },
  },
  fields: [
    {
      type: "string",
      name: "embedSrc",
      label: "Embed SRC",
      description: "Path to a .webm file, e.g. /img/docs/editing/markdown.webm",
    },
    {
      type: "string",
      name: "width",
      label: "Width",
      description: "CSS width of the video, e.g. 100% or 640px",
    },
  ],
};

export default WebmEmbedTemplate;
