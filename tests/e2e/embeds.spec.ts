import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";
const samplePage = `${basePath}/tinadocs-features/tina-io-embeds`;

const embeds = [
  { name: "GraphQLCodeBlock", testId: "graphql-code-block" },
  { name: "WebmEmbed", testId: "webm-embed" },
  { name: "ImageAndText", testId: "image-and-text" },
  { name: "Iframe", testId: "iframe-embed" },
  { name: "SummaryTab", testId: "summary-tab" },
  { name: "propertyTable", testId: "property-table" },
];

test.describe("tina.io embeds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(samplePage);
    await page.waitForLoadState("networkidle");
  });

  for (const { name, testId } of embeds) {
    test(`renders ${name}`, async ({ page }) => {
      await expect(page.getByTestId(testId)).toBeVisible();
    });
  }
});
