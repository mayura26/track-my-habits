import { expect, test } from "./fixtures";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

test.describe("Habit scheduling", () => {
  test("weekday selection persists and shows on the detail page", async ({
    page,
  }) => {
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Weekday Habit E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });

    // Deselect the weekend — habit should run Mon–Fri only.
    await page.getByRole("button", { name: "Sat", exact: true }).click();
    await page.getByRole("button", { name: "Sun", exact: true }).click();

    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    await page.getByText("Weekday Habit E2E").first().click();
    await page.getByRole("tab", { name: "Settings" }).click();

    await expect(page.getByText("Mon, Tue, Wed, Thu, Fri")).toBeVisible();
  });

  test("time-of-day bucket persists and shows on the detail page", async ({
    page,
  }) => {
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Evening Habit E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Evening" }).click();

    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    await page.getByText("Evening Habit E2E").first().click();
    await page.getByRole("tab", { name: "Settings" }).click();

    const config = page
      .locator("dl")
      .filter({ hasText: "Time of day" })
      .first();
    await expect(config.getByText("Evening", { exact: true })).toBeVisible();
  });

  test("Today section shows scheduled habits and hides off-day habits", async ({
    page,
  }) => {
    const todayLabel = WEEKDAY_LABELS[new Date().getDay()];

    // Scheduled for today, in the Morning bucket.
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Today Habit E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Morning" }).click();
    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    // Not scheduled for today (today's weekday deselected).
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Offday Habit E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: todayLabel, exact: true }).click();
    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    await page.goto("/dashboard");

    // Bucket sub-sections inside the unified "Today" view.
    const bucketSections = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: /^(Morning|Day|Evening|Before Bed)$/,
      }),
    });

    await expect(
      bucketSections.getByText("Today Habit E2E").first(),
    ).toBeVisible();
    await expect(bucketSections.getByText("Offday Habit E2E")).toHaveCount(0);
  });
});
