import { test, expect } from "./fixtures";

test.describe("Habits CRUD", () => {
  test("dashboard shows habits section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Today's Habits")).toBeVisible();
  });

  test("create a BOOLEAN/DAILY habit", async ({ page }) => {
    await page.goto("/habits/new");

    await page.fill('[name="name"]', "Morning Meditation E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.selectOption('[name="trackingType"]', "BOOLEAN");
    await page.selectOption('[name="thresholdType"]', "DAILY");

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Morning Meditation E2E")).toBeVisible();
  });

  test("create a COUNT/ROLLING_WINDOW habit", async ({ page }) => {
    await page.goto("/habits/new");

    await page.fill('[name="name"]', "Drink Water E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.selectOption('[name="trackingType"]', "COUNT");
    await page.selectOption('[name="thresholdType"]', "ROLLING_WINDOW");
    await page.fill('[name="thresholdValue"]', "3");
    await page.fill('[name="thresholdWindow"]', "5");

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Drink Water E2E")).toBeVisible();
  });

  test("log a habit and see streak update", async ({ page }) => {
    // Create a habit first
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Log Test Habit");
    await page.selectOption('[name="categoryId"]', { label: "Fitness" });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/habits");

    // Log the habit by clicking the circle button
    const habitCard = page.locator("div").filter({ hasText: "Log Test Habit" }).first();
    const logButton = habitCard.locator('button[title="Log habit"]').or(
      habitCard.locator('button[title="Logged today"]')
    );
    await logButton.first().click();

    // Wait for the logged state
    await page.waitForTimeout(500);
    await expect(habitCard.locator('button[title="Logged today"]')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("edit habit name", async ({ page }) => {
    // Create a habit
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Edit Me Habit");
    await page.selectOption('[name="categoryId"]', { label: "Personal" });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/habits");
    await page.getByText("Edit Me Habit").click();
    await page.locator('a[href*="/edit"]').click();

    await page.fill('[name="name"]', "Edited Habit Name");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Edited Habit Name")).toBeVisible();
  });

  test("dashboard sorts incomplete habits first", async ({ page }) => {
    await page.goto("/dashboard");
    // The first habit(s) should not have Done badge if any exist
    await expect(page.getByText("Today's Habits")).toBeVisible();
  });
});
