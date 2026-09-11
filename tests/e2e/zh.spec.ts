import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

test.describe("Chinese docs", () => {
  test("serves the zh home with zh navigation and a switcher back to English", async ({
    page,
  }) => {
    await page.goto(`${basePath}/zh`);

    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    const sidebar = page.getByRole("tabpanel");
    await expect(sidebar).toBeVisible();
    const zhLinks = sidebar.locator(`a[href^="${basePath}/zh"]`);
    await expect(zhLinks.first()).toBeVisible();
    const enLinks = sidebar.locator(
      `a[href^="${basePath}/"]:not([href^="${basePath}/zh"])`
    );
    await expect(enLinks).toHaveCount(0);

    const switcher = page.getByTestId("language-switcher");
    await expect(switcher).toHaveAttribute("href", basePath);
    await expect(switcher).toHaveText("English");
  });
});
