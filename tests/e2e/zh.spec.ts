import { type Page, expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

async function localeCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === "NEXT_LOCALE")?.value;
}

test.describe("Chinese docs", () => {
  test("serves the zh home with zh navigation and a language selector back to English", async ({
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
    await expect(page.getByTestId("navbar-logo")).toHaveAttribute(
      "href",
      `${basePath}/zh`
    );

    const switcher = page.getByTestId("language-switcher");
    await expect(switcher.locator("img")).toHaveAttribute(
      "src",
      /flags(\/|%2F)zh\.png/
    );
    await switcher.click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "选择语言" })
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "English" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Chinese" })).toBeVisible();

    await dialog.getByRole("button", { name: "English" }).click();

    await expect(page).toHaveURL(new RegExp(`${basePath}/?$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await localeCookie(page)).toBe("en");
  });

  test("switches a nested zh page to its English sibling", async ({ page }) => {
    await page.goto(`${basePath}/zh/tina-folder/overview`);

    await expect(page.locator("html")).toHaveAttribute("lang", "zh");

    await page.getByTestId("language-switcher").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "English" })
      .click();

    await expect(page).toHaveURL(
      new RegExp(`${basePath}/tina-folder/overview/?$`)
    );
    expect(await localeCookie(page)).toBe("en");
  });

  test("falls back to the English home when a zh page has no English sibling", async ({
    page,
  }) => {
    await page.goto(`${basePath}/zh/drafts/editorial-workflow`);

    await page.getByTestId("language-switcher").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "English" })
      .click();

    await expect(page).toHaveURL(new RegExp(`${basePath}/?$`));
    expect(await localeCookie(page)).toBe("en");
  });

  test("switches an English page to its zh sibling and remembers the choice", async ({
    page,
  }) => {
    await page.goto(`${basePath}/tina-folder/overview`);

    await page.getByTestId("language-switcher").click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Select your language" })
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Chinese" }).click();

    await expect(page).toHaveURL(
      new RegExp(`${basePath}/zh/tina-folder/overview/?$`)
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");
    expect(await localeCookie(page)).toBe("zh");
  });

  test("choosing the current language closes the dialog without navigating", async ({
    page,
  }) => {
    await page.goto(`${basePath}/tina-folder/overview`);

    await page.getByTestId("language-switcher").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "English" }).click();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(
      new RegExp(`${basePath}/tina-folder/overview/?$`)
    );
    expect(await localeCookie(page)).toBeUndefined();
  });
});
