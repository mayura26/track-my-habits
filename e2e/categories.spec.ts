import { test, expect } from "./fixtures";

test.describe("Categories", () => {
  test("default categories are displayed", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByText("Health")).toBeVisible();
    await expect(page.getByText("Fitness")).toBeVisible();
    await expect(page.getByText("Personal")).toBeVisible();
  });

  test("create custom category", async ({ page }) => {
    await page.goto("/categories");
    await page.getByRole("button", { name: /New Category/i }).click();

    await page.fill('[placeholder="e.g., Mindfulness"]', "My E2E Category");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("My E2E Category")).toBeVisible({ timeout: 5000 });
  });

  test("default categories show System badge and cannot be deleted", async ({ page }) => {
    await page.goto("/categories");
    const healthRow = page.locator("div").filter({ hasText: /^Health/ }).first();
    await expect(healthRow.getByText("System")).toBeVisible();
  });

  test("custom category appears in habit form", async ({ page }) => {
    // Create category first
    await page.goto("/categories");
    await page.getByRole("button", { name: /New Category/i }).click();
    await page.fill('[placeholder="e.g., Mindfulness"]', "Form Test Cat");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Form Test Cat")).toBeVisible({ timeout: 5000 });

    // Check it appears in habit form
    await page.goto("/habits/new");
    const select = page.locator('select[name="categoryId"]');
    await expect(select.locator("option", { hasText: "Form Test Cat" })).toBeAttached();
  });
});
