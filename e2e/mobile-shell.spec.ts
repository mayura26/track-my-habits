import { expect, test } from "./fixtures";

test.describe("Mobile shell (PWA layout)", () => {
  test("bottom navigation and FAB are visible on small viewports", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("navigation").filter({ hasText: "Today" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create habit" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Habits" })).toBeVisible();
  });

  test("manifest is served for installable PWA metadata", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.display).toMatch(/standalone|fullscreen/);
    expect(json.icons?.length).toBeGreaterThan(0);
  });

  test("habits form is usable on mobile (name field and submit)", async ({
    page,
  }) => {
    await page.goto("/habits/new");
    await expect(page.getByLabel("Habit name")).toBeVisible();
    await page.fill('[name="name"]', "Mobile Shell Habit");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Mobile Shell Habit").first()).toBeVisible();
  });
});
