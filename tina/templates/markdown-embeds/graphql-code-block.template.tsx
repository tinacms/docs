const spacingPlaceholder = {
  component: "textarea",
  format: (val?: string) => val?.replaceAll("#", " "),
  parse: (val?: string) => val?.replaceAll(" ", "#"),
};

export const GraphQLCodeBlockTemplate = {
  name: "GraphQLCodeBlock",
  label: "GraphQL Code Block",
  ui: {
    defaultItem: {
      preselectResponse: false,
    },
  },
  fields: [
    {
      type: "string",
      name: "query",
      label: "Query",
      description:
        'Paste GraphQL query here. "#" are auto-inserted as spacing placeholders and should not be used.',
      ui: spacingPlaceholder,
    },
    {
      type: "string",
      name: "response",
      label: "Response",
      description:
        'Paste GraphQL response data here. "#" are auto-inserted as spacing placeholders and should not be used.',
      ui: spacingPlaceholder,
    },
    {
      type: "boolean",
      name: "preselectResponse",
      label: "Select Response by Default",
      description: "Select the response tab by default",
    },
    {
      type: "string",
      name: "customQueryName",
      label: "Custom Query Name",
      description: "Replaces 'Query' in the tab name",
    },
    {
      type: "string",
      name: "customResponseName",
      label: "Custom Response Name",
      description: "Replaces 'Response' in the tab name",
    },
  ],
};

export default GraphQLCodeBlockTemplate;
