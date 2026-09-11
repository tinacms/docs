import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

const NESTED_PAGE = "/frameworks/next/app-router";

const breadcrumbNav = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "breadcrumb" });

test.describe("Breadcrumbs", () => {
  test("shows the full trail from the tab on a nested page", async ({
    page,
  }) => {
    await page.goto(`${basePath}${NESTED_PAGE}`);

    const trail = breadcrumbNav(page).locator("ol").filter({ visible: true });
    await expect(trail).toHaveCount(1);

    const items = trail.locator("[data-slot='breadcrumb-item']");
    await expect(items.first()).toHaveText("Docs");
    await expect(items.first().locator("a")).toHaveAttribute("href", basePath);
    await expect(items.last().locator("[aria-current='page']")).toBeVisible();
    await expect(
      trail.locator("[data-slot='breadcrumb-separator']").first()
    ).toHaveText(">");
  });

  test("renders nothing on the docs home", async ({ page }) => {
    await page.goto(basePath);

    await expect(page.getByRole("tabpanel")).toBeVisible();
    await expect(breadcrumbNav(page)).toHaveCount(0);
  });

  test("collapses to a single back link on a phone viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${basePath}${NESTED_PAGE}`);

    const links = breadcrumbNav(page).locator("a").filter({ visible: true });
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute(
      "href",
      new RegExp(`^${basePath}/(?!frameworks/next/app-router$)`)
    );
    await expect(
      breadcrumbNav(page).locator("[aria-current='page']").filter({
        visible: true,
      })
    ).toHaveCount(0);
  });

  test("keeps every zh crumb link under the zh locale", async ({ page }) => {
    await page.goto(`${basePath}/zh${NESTED_PAGE}`);

    const trail = breadcrumbNav(page).locator("ol").filter({ visible: true });
    await expect(
      trail.locator("[data-slot='breadcrumb-item']").first()
    ).toHaveText("文档");

    const hrefs = await trail
      .locator("a")
      .evaluateAll((anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href"))
      );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(new RegExp(`^${basePath}/zh(/|$)`));
    }
  });
});
