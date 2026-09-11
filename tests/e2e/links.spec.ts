import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

// Disabling JS means these assertions read the server-rendered href directly,
// so a bug that only self-corrects after hydration (or a client effect) can't hide.
test.describe("Server-rendered internal links", () => {
  test.use({ javaScriptEnabled: false });

  test("cardGrid links carry the authored public path, not a basePath-doubled one", async ({
    page,
  }) => {
    await page.goto(`${basePath}/setup-overview`);

    const hrefs = await page
      .getByTestId("card-grid-link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));

    expect(hrefs).toContain("/docs/introduction/using-starter/");
    for (const href of hrefs) {
      expect(href).not.toContain(`${basePath}${basePath}`);
    }
  });

  test("the language switcher points at the locale home when a zh page has no English sibling", async ({
    page,
  }) => {
    await page.goto(`${basePath}/zh/drafts/editorial-workflow`);

    await expect(page.getByTestId("language-switcher")).toHaveAttribute(
      "href",
      basePath
    );
  });
});
