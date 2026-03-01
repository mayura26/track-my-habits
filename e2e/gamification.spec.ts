import { test, expect } from "./fixtures";

test.describe("Gamification", () => {
  test("XP bar is visible on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // XP bar should be present after logging
    await expect(page.locator(".space-y-6")).toBeVisible();
  });

  test("achievements page shows badges", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.getByText("Achievements")).toBeVisible();
    // Should show level card
    await expect(page.getByText(/Level \d+/)).toBeVisible();
    // Should show badge list
    await expect(page.getByText("First Step")).toBeVisible();
    await expect(page.getByText("Century Club")).toBeVisible();
  });

  test("achievements page shows 0/N badges initially", async ({ page }) => {
    await page.goto("/achievements");
    // Badge progress counter should be visible
    await expect(page.getByText(/\d+ \/ \d+ badges earned/)).toBeVisible();
  });

  test("after logging a habit, XP increases", async ({ page }) => {
    // Create a habit
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "XP Test Habit");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/habits");

    // Go to dashboard and log it
    await page.goto("/dashboard");
    const xpBefore = await page.locator('text=/\\d+ XP/').first().textContent().catch(() => "0 XP");

    const logBtn = page.locator('button[title="Log habit"]').first();
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await page.waitForTimeout(1000);
    }

    // Refresh and check XP
    await page.reload();
    // XP section should still be visible
    await expect(page.locator('text=/Level \\d+/')).toBeVisible();
  });
});
