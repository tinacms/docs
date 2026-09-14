import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("the page does not scroll horizontally", async ({ page }) => {
    for (const path of [`${basePath}`, `${basePath}/tina-folder/overview`]) {
      await page.goto(path);
      await expect(page.getByTestId("navbar-logo")).toBeVisible();

      const widths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(widths.scrollWidth, path).toBeLessThanOrEqual(widths.innerWidth);
    }
  });

  test("the hamburger drawer holds the CTA buttons", async ({ page }) => {
    await page.goto(`${basePath}`);

    await page.getByTestId("mobile-nav-toggle").click();

    const ctas = page.getByTestId("mobile-nav-ctas");
    await expect(ctas).toBeVisible();
    await expect(
      ctas.getByRole("link", { name: "TinaCMS Home" })
    ).toHaveAttribute("href", "https://tina.io/tinacms");
    await expect(ctas.getByRole("link", { name: "TinaCloud" })).toHaveAttribute(
      "href",
      "https://app.tina.io"
    );

    const ctaBox = await ctas.boundingBox();
    const viewport = page.viewportSize();
    expect(ctaBox).not.toBeNull();
    expect((ctaBox?.y ?? 0) + (ctaBox?.height ?? 0)).toBeLessThanOrEqual(
      viewport?.height ?? 0
    );
  });
});
