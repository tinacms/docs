import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

const embeds = [
  {
    name: "GraphQLCodeBlock",
    testId: "graphql-code-block",
    path: "/editing/blocks",
  },
  { name: "WebmEmbed", testId: "webm-embed", path: "/editing/blocks" },
  {
    name: "ImageAndText",
    testId: "image-and-text",
    path: "/tina-folder/overview",
  },
  {
    name: "propertyTable",
    testId: "property-table",
    path: "/contextual-editing/tinafield",
  },
];

test.describe("tina.io embeds", () => {
  for (const { name, testId, path } of embeds) {
    test(`renders ${name} on ${path}`, async ({ page }) => {
      await page.goto(`${basePath}${path}`);
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId(testId).first()).toBeVisible();
    });
  }
});
