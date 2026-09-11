import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/docs";

// content/navigation-bar/docs-navigation-bar.json, Docs tab, supermenuGroup order:
// 0 Introduction, 1 Configuring TinaCMS, 2 Querying Content
const FIRST_GROUP = "nav-group-0";
const SECOND_GROUP = "nav-group-1";
const UNRELATED_GROUP = "nav-group-2";

const FIRST_GROUP_ITEM = `a[href="${basePath}/setup-overview"]`;
// First slug under the second group (Configuring TinaCMS).
const NESTED_PAGE = "/tina-folder/overview";
const SECOND_GROUP_ITEM = `a[href="${basePath}/reference/config"]`;
const UNRELATED_GROUP_ITEM = `a[href="${basePath}/features/data-fetching"]`;

test.describe("Sidebar default expand state", () => {
  test("only the current page is highlighted on the docs home page", async ({
    page,
  }) => {
    await page.goto(`${basePath}/`);

    const highlighted = page.locator('[data-selected="true"]');
    await expect(highlighted).toHaveCount(1);
    await expect(highlighted.first()).toContainText("What is TinaCMS");
  });

  test("only the first top-level group is open on the docs home page", async ({
    page,
  }) => {
    await page.goto(`${basePath}/`);

    const firstGroup = page.getByTestId(FIRST_GROUP);
    const secondGroup = page.getByTestId(SECOND_GROUP);
    await expect(firstGroup).toHaveCount(1);
    await expect(secondGroup).toHaveCount(1);

    await expect(firstGroup.locator(FIRST_GROUP_ITEM)).toBeVisible();
    await expect(secondGroup.locator(SECOND_GROUP_ITEM)).not.toBeVisible();
  });

  test("visiting a nested page opens its ancestor group and leaves unrelated groups closed", async ({
    page,
  }) => {
    await page.goto(`${basePath}${NESTED_PAGE}`);

    const secondGroup = page.getByTestId(SECOND_GROUP);
    const unrelatedGroup = page.getByTestId(UNRELATED_GROUP);
    await expect(secondGroup).toHaveCount(1);
    await expect(unrelatedGroup).toHaveCount(1);

    await expect(secondGroup.locator(SECOND_GROUP_ITEM)).toBeVisible();
    await expect(
      unrelatedGroup.locator(UNRELATED_GROUP_ITEM)
    ).not.toBeVisible();
  });
});
