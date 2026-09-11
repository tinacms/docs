import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

const ALIAS = "git-coauthor";
const DOC_PATH = "/tinacloud/git-co-authoring";

test.describe("Alias permalinks", () => {
  test("redirects /r/<alias> to the doc page", async ({ page }) => {
    await page.goto(`${basePath}/r/${ALIAS}`);

    await expect(page).toHaveURL(new RegExp(`${basePath}${DOC_PATH}/?$`));
  });

  test("answers with a 307 pointing at the doc page", async ({ request }) => {
    const response = await request.get(`${basePath}/r/${ALIAS}`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(
      new RegExp(`${basePath}${DOC_PATH}/?$`)
    );
  });

  test("returns 404 for an unknown alias", async ({ request }) => {
    const response = await request.get(`${basePath}/r/not-a-real-alias`, {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(404);
  });
});
