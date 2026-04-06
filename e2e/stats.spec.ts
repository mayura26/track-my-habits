import { expect, test } from "./fixtures";

test.describe("Stats", () => {
  test("stats page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/stats");
    await expect(page.getByText("Progress")).toBeVisible();
    expect(errors.filter((e) => !e.includes("Warning"))).toHaveLength(0);
  });

  test("heatmap grid renders", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Consistency map")).toBeVisible();
    // Check heatmap cells exist
    const cells = page.locator(".rounded-sm");
    await expect(cells.first()).toBeVisible({ timeout: 5000 });
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
  });

  test("area chart container is visible", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Daily rhythm")).toBeVisible();
  });

  test("weekly bar chart is visible", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Weekly momentum")).toBeVisible();
  });

  test("stats page shows quick stats cards", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("total logs")).toBeVisible();
    await expect(page.getByText("active", { exact: true })).toBeVisible();
    await expect(page.getByText("top streak")).toBeVisible();
  });
});
