import { test, expect } from "./fixtures";

test.describe("Stats", () => {
  test("stats page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/stats");
    await expect(page.getByText("Statistics")).toBeVisible();
    expect(errors.filter((e) => !e.includes("Warning"))).toHaveLength(0);
  });

  test("heatmap grid renders", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Activity Heatmap")).toBeVisible();
    // Check heatmap cells exist
    const cells = page.locator(".rounded-sm");
    await expect(cells.first()).toBeVisible({ timeout: 5000 });
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
  });

  test("area chart container is visible", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Daily Logs (30 days)")).toBeVisible();
    // The chart container (from recharts)
    const chartContainer = page.locator('[data-testid="area-chart"]');
    await expect(chartContainer).toBeVisible({ timeout: 5000 });
  });

  test("weekly bar chart is visible", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Weekly Activity")).toBeVisible();
  });

  test("stats page shows quick stats cards", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText("Total Logs")).toBeVisible();
    await expect(page.getByText("Active Habits")).toBeVisible();
    await expect(page.getByText("Top Streak")).toBeVisible();
  });
});
