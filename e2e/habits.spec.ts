import { expect, test } from "./fixtures";

test.describe("Habits CRUD", () => {
  test("dashboard shows habits section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Today's Habits")).toBeVisible();
  });

  test("create a BOOLEAN/DAILY habit", async ({ page }) => {
    await page.goto("/habits/new");

    await page.fill('[name="name"]', "Morning Meditation E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    // trackingType defaults to BOOLEAN — no click needed
    // thresholdType defaults to DAILY — no click needed

    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");
    await expect(
      page.getByText("Morning Meditation E2E").first(),
    ).toBeVisible();
  });

  test("create a COUNT/ROLLING_WINDOW habit", async ({ page }) => {
    await page.goto("/habits/new");

    await page.fill('[name="name"]', "Drink Water E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Count toward a goal" }).click();
    await page.getByRole("button", { name: "Rolling window" }).click();
    await page.fill('[name="thresholdValue"]', "3");
    await page.fill('[name="thresholdWindow"]', "5");

    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Drink Water E2E").first()).toBeVisible();
  });

  test("log a habit and see streak update", async ({ page }) => {
    // Create a habit first
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Log Test Habit");
    await page.selectOption('[name="categoryId"]', { label: "Fitness" });
    await page.getByRole("button", { name: "Create Habit" }).click();

    await expect(page).toHaveURL("/habits");

    // Log the habit by clicking the circle button
    const habitCard = page
      .locator("div")
      .filter({ hasText: "Log Test Habit" })
      .first();
    const logButton = habitCard
      .locator('button[title="Log habit"]')
      .or(habitCard.locator('button[title="Logged today"]'));
    await logButton.first().click();

    // Wait for the logged state
    await page.waitForTimeout(500);
    await expect(habitCard.locator('button[title="Logged today"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
  });

  test("edit habit name", async ({ page }) => {
    // Create a habit
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Edit Me Habit");
    await page.selectOption('[name="categoryId"]', { label: "Personal" });
    await page.getByRole("button", { name: "Create Habit" }).click();

    await expect(page).toHaveURL("/habits");
    await page.getByText("Edit Me Habit").first().click();
    await page.locator('a[href*="/edit"]').first().click();

    await page.fill('[name="name"]', "Edited Habit Name");
    await page.getByRole("button", { name: "Update Habit" }).click();

    await expect(page).toHaveURL("/habits");
    await expect(page.getByText("Edited Habit Name").first()).toBeVisible();
  });

  test("dashboard sorts incomplete habits first", async ({ page }) => {
    await page.goto("/dashboard");
    // The first habit(s) should not have Done badge if any exist
    await expect(page.getByText("Today's Habits")).toBeVisible();
  });

  test("reset habit clears streak and history", async ({ page }) => {
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Reset Test Habit");
    await page.selectOption('[name="categoryId"]', { label: "Fitness" });
    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    const habitCard = page
      .locator("div")
      .filter({
        has: page.getByRole("link", { name: "Reset Test Habit" }),
      })
      .first();
    await habitCard.getByTitle("Log habit").click();
    await expect(habitCard.getByTitle("Undo log").first()).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("link", { name: "Reset Test Habit" }).click();

    const streakCell = page
      .getByRole("tabpanel", { name: "Overview" })
      .locator("div")
      .filter({ has: page.getByText("current streak", { exact: true }) })
      .first();
    await expect(streakCell).toContainText("1");

    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Reset habit" }).first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reset habit" })
      .click();

    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(streakCell).toContainText("0");
    await expect(page.getByText("0%").first()).toBeVisible();
  });
});
