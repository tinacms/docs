import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

test("renders the rows of a Markdown table", async ({ page }) => {
  await page.goto(`${basePath}/tinacloud/network-requirements`);

  const table = page.locator("table").first();
  await expect(table.locator("thead th")).toHaveText(["Domain", "Purpose"]);
  await expect(
    table.locator("tbody tr").first().locator("td").first()
  ).toHaveText("*.tina.io");
});
