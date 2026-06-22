import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

async function firstCategoryId(page: Page) {
  const categoriesRes = await page.request.get("/api/categories");
  expect(categoriesRes.ok()).toBeTruthy();
  const categories = await categoriesRes.json();
  expect(categories[0]?.id).toBeTruthy();
  return categories[0].id as string;
}

async function createDeadlineHabit(
  page: Page,
  overrides: Record<string, unknown> = {},
) {
  const categoryId = await firstCategoryId(page);
  const createRes = await page.request.post("/api/habits", {
    data: {
      name: `Deadline Habit ${Date.now()} ${Math.random()}`,
      categoryId,
      trackingType: "TIME_DEADLINE",
      thresholdType: "DAILY",
      thresholdValue: 1,
      deadlineTime: "23:59",
      deadlineGraceMinutes: 0,
      reminderEnabled: true,
      reminderLeadMinutes: 10,
      bucket: "BEFORE_BED",
      ...overrides,
    },
  });
  expect(createRes.ok()).toBeTruthy();
  return createRes.json();
}

test.describe("Time-deadline habits", () => {
  test("creates, shows, and edits deadline settings", async ({ page }) => {
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "Bed by Ten E2E");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Time deadline" }).click();
    await page.fill('[name="deadlineTime"]', "22:00");
    await page.fill('[name="deadlineGraceMinutes"]', "10");
    await page.fill('[name="reminderLeadMinutes"]', "15");

    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    await page.getByText("Bed by Ten E2E").first().click();
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByText("Time deadline")).toBeVisible();
    await expect(page.getByText("22:00")).toBeVisible();
    await expect(page.getByText("10 min")).toBeVisible();
    await expect(page.getByText("15 min before")).toBeVisible();

    await page.locator('a[href$="/edit"]').first().click();
    await page.fill('[name="deadlineGraceMinutes"]', "20");
    await page.getByRole("button", { name: "Update Habit" }).click();
    await expect(page).toHaveURL("/habits");
  });

  test("logs before deadline, within grace, and after grace correctly", async ({
    page,
  }) => {
    const before = await createDeadlineHabit(page, {
      name: "Deadline Before E2E",
      deadlineTime: "12:30",
      deadlineGraceMinutes: 0,
    });
    let res = await page.request.post(`/api/habits/${before.id}/log`, {
      data: { loggedAt: "2026-06-22T12:00:00.000Z", source: "MANUAL" },
    });
    expect(res.ok()).toBeTruthy();
    let body = await res.json();
    expect(body.log.status).toBe("COMPLETED");
    expect(body.xpGained).toBeGreaterThan(0);

    const grace = await createDeadlineHabit(page, {
      name: "Deadline Grace E2E",
      deadlineTime: "11:55",
      deadlineGraceMinutes: 10,
    });
    res = await page.request.post(`/api/habits/${grace.id}/log`, {
      data: { loggedAt: "2026-06-22T12:00:00.000Z", source: "MANUAL" },
    });
    expect(res.ok()).toBeTruthy();
    body = await res.json();
    expect(body.log.status).toBe("COMPLETED");

    const late = await createDeadlineHabit(page, {
      name: "Deadline Late E2E",
      deadlineTime: "11:00",
      deadlineGraceMinutes: 10,
    });
    res = await page.request.post(`/api/habits/${late.id}/log`, {
      data: { loggedAt: "2026-06-22T12:00:00.000Z", source: "MANUAL" },
    });
    expect(res.ok()).toBeTruthy();
    body = await res.json();
    expect(body.log.status).toBe("FAILED");
    expect(body.log.value).toBe(0);
    expect(body.xpGained).toBe(0);
  });

  test("computed auto-fail is visible without creating a failed log", async ({
    page,
  }) => {
    const habit = await createDeadlineHabit(page, {
      name: `Deadline Auto Miss E2E ${Date.now()}`,
      deadlineTime: "00:00",
      deadlineGraceMinutes: 0,
    });

    await page.goto("/habits");
    await expect(
      page.getByRole("link", { name: habit.name }).first(),
    ).toBeVisible();
    await expect(page.getByTitle("Record missed").first()).toBeVisible();

    const habits = await page.request.get("/api/habits").then((r) => r.json());
    const updated = habits.find((item: { id: string }) => item.id === habit.id);
    expect(updated.logs).toHaveLength(0);
  });

  test("off-day deadline habits do not appear as due today", async ({
    page,
  }) => {
    const tomorrow = WEEKDAYS[(new Date().getUTCDay() + 1) % 7];
    const habit = await createDeadlineHabit(page, {
      name: `Deadline Offday E2E ${Date.now()}`,
      deadlineTime: "00:00",
      scheduledWeekdays: [tomorrow],
    });

    await page.goto("/dashboard");
    await expect(page.getByText(habit.name)).toHaveCount(0);
  });
});
