import { tinaField } from "tinacms/dist/react";
import { CodeTabs } from "./code-tabs";

interface GraphQLCodeBlockProps {
  query?: string;
  response?: string;
  preselectResponse?: boolean;
  customQueryName?: string;
  customResponseName?: string;
}

const withoutSpacingPlaceholders = (value?: string) =>
  value?.replaceAll("#", " ") ?? "";

export default function GraphQLCodeBlock(props: GraphQLCodeBlockProps) {
  const {
    query,
    response,
    preselectResponse = false,
    customQueryName,
    customResponseName,
  } = props;

  return (
    <div
      data-testid="graphql-code-block"
      data-tina-field={tinaField(props, "query")}
    >
      <CodeTabs
        tabs={[
          {
            name: customQueryName || "Query",
            content: withoutSpacingPlaceholders(query),
            language: "graphql",
          },
          {
            name: customResponseName || "Response",
            content: withoutSpacingPlaceholders(response),
            language: "json",
          },
        ]}
        initialSelectedIndex={preselectResponse ? 1 : 0}
      />
    </div>
  );
}
