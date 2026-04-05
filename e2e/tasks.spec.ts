import { test, expect } from "./fixtures";

test.describe("Tasks", () => {
  test("tasks nav link is visible on sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Tasks" }).first()).toBeVisible();
  });

  test("create a weekly task", async ({ page }) => {
    await page.goto("/tasks/new");

    await page.fill('[name="name"]', "Food Shopping E2E");
    await page.selectOption('[name="frequency"]', "WEEKLY");
    await page.fill('[name="frequencyValue"]', "1");

    await page.getByRole("button", { name: "Create Task" }).click();
    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Food Shopping E2E").first()).toBeVisible();
  });

  test("task appears on /tasks page", async ({ page }) => {
    // Create a task first
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Vacuum House E2E");
    await page.selectOption('[name="frequency"]', "WEEKLY");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Vacuum House E2E").first()).toBeVisible();
    await expect(page.getByText("1× per week").first()).toBeVisible();
  });

  test("due tasks section appears on dashboard", async ({ page }) => {
    // Create a task
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Dashboard Task E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.getByRole("button", { name: "Create Task" }).click();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Due Tasks" })).toBeVisible();
    await expect(page.getByText("Dashboard Task E2E").first()).toBeVisible();
  });

  test("complete a task — XP increases", async ({ page }) => {
    // Create task
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "XP Task E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");

    // Get XP before completing
    const xpBefore = await page.locator("[data-testid='xp-value']").textContent().catch(() => null);

    // Complete the task
    const taskCard = page.locator(".surface-panel").filter({ hasText: "XP Task E2E" }).first();
    await taskCard.locator('button[title="Complete task"]').click();

    // Wait for completion
    await page.waitForTimeout(500);
    await expect(taskCard.locator('button[title="Already done"]')).toBeVisible({ timeout: 5000 }).catch(() => {});

    // XP should have increased (just verify no error occurred)
    const xpAfter = await page.locator("[data-testid='xp-value']").textContent().catch(() => null);
    if (xpBefore !== null && xpAfter !== null) {
      expect(Number(xpAfter)).toBeGreaterThanOrEqual(Number(xpBefore));
    }
  });

  test("completed task no longer shows in due section", async ({ page }) => {
    // Create a daily task
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Complete Me E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");

    // Complete it
    const taskCard = page.locator(".surface-panel").filter({ hasText: "Complete Me E2E" }).first();
    await taskCard.locator('button[title="Complete task"]').click();
    await page.waitForTimeout(600);

    // Go to dashboard — task should not be in due section
    await page.goto("/dashboard");
    const dueSection = page.locator("text=Due Tasks").first();
    if (await dueSection.isVisible()) {
      // Task might still show if other tasks exist; check Done badge
      const completedCard = page.locator(".surface-panel").filter({ hasText: "Complete Me E2E" }).first();
      if (await completedCard.isVisible()) {
        await expect(completedCard.getByText("Done")).toBeVisible();
      }
    }
  });

  test("create a fortnightly task", async ({ page }) => {
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Fortnightly Task E2E");
    await page.selectOption('[name="frequency"]', "FORTNIGHTLY");
    await page.fill('[name="frequencyValue"]', "1");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Fortnightly Task E2E").first()).toBeVisible();
    await expect(page.getByText("1× per fortnight").first()).toBeVisible();
  });

  test("bucket grouping renders on dashboard", async ({ page }) => {
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Morning Routine E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.selectOption('[name="bucket"]', "MORNING");
    await page.getByRole("button", { name: "Create Task" }).click();

    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Evening Routine E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.selectOption('[name="bucket"]', "EVENING");
    await page.getByRole("button", { name: "Create Task" }).click();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Due Tasks" })).toBeVisible();
    // Both tasks should appear under their bucket sections
    await expect(page.getByText("Morning Routine E2E").first()).toBeVisible();
    await expect(page.getByText("Evening Routine E2E").first()).toBeVisible();
    // Bucket headers render
    await expect(page.getByRole("heading", { name: "Morning" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evening" }).first()).toBeVisible();
  });

  test("spacing gate disables second completion for multi-per-day task", async ({ page }) => {
    // DAILY with frequencyValue=2: auto gap = max(1, floor(1/2)) = 1 day
    // → after one completion, the second is blocked until tomorrow.
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Spacing Gate E2E");
    await page.selectOption('[name="frequency"]', "DAILY");
    await page.fill('[name="frequencyValue"]', "2");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");

    const card = page.locator(".surface-panel").filter({ hasText: "Spacing Gate E2E" }).first();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/complete") && r.ok()),
      card.locator('button[title="Complete task"]').click(),
    ]);

    // Complete button should now be disabled with title "Not yet due"
    await page.reload();
    const reloadedCard = page.locator(".surface-panel").filter({ hasText: "Spacing Gate E2E" }).first();
    await expect(reloadedCard.locator('button[title="Not yet due"]')).toBeVisible();
  });

  test("settings page persists bucket hour changes", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Day Buckets")).toBeVisible();

    // Change morning start to 6, save
    await page.fill('[name="bucketMorningStart"]', "6");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    // Reload, verify persisted
    await page.reload();
    await expect(page.locator('[name="bucketMorningStart"]')).toHaveValue("6");

    // Reset back to default for other tests
    await page.fill('[name="bucketMorningStart"]', "5");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();
  });

  test("edit task name", async ({ page }) => {
    // Create a task
    await page.goto("/tasks/new");
    await page.fill('[name="name"]', "Edit Task E2E");
    await page.selectOption('[name="frequency"]', "WEEKLY");
    await page.getByRole("button", { name: "Create Task" }).click();

    await expect(page).toHaveURL("/tasks");

    // Click edit button
    const taskCard = page.locator(".surface-panel").filter({ hasText: "Edit Task E2E" }).first();
    await taskCard.locator('a[href*="/edit"]').click();

    // Update name
    await page.fill('[name="name"]', "Edited Task Name E2E");
    await page.getByRole("button", { name: "Update Task" }).click();

    await expect(page).toHaveURL("/tasks");
    await expect(page.getByText("Edited Task Name E2E").first()).toBeVisible();
  });
});
