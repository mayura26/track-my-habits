import { expect, test } from "./fixtures";

test.describe("Reminder notification actions", () => {
  test("snoozes and completes a task reminder", async ({ page }) => {
    const name = `Reminder Task ${Date.now()}`;
    const createRes = await page.request.post("/api/tasks", {
      data: {
        name,
        frequency: "DAILY",
        frequencyValue: 1,
        bucket: "DAY",
        reminderEnabled: true,
        reminderTime: "00:00",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const task = await createRes.json();

    const snoozeRes = await page.request.post("/api/reminders/actions", {
      data: {
        entityType: "task",
        entityId: task.id,
        action: "snooze",
      },
    });
    expect(snoozeRes.ok()).toBeTruthy();

    let tasks = await page.request.get("/api/tasks").then((res) => res.json());
    let updatedTask = tasks.find((item: { id: string }) => item.id === task.id);
    expect(updatedTask.reminderSnoozedUntil).toBeTruthy();

    const completeRes = await page.request.post("/api/reminders/actions", {
      data: {
        entityType: "task",
        entityId: task.id,
        action: "complete",
      },
    });
    expect(completeRes.ok()).toBeTruthy();

    tasks = await page.request.get("/api/tasks").then((res) => res.json());
    updatedTask = tasks.find((item: { id: string }) => item.id === task.id);
    expect(updatedTask.reminderSnoozedUntil).toBeNull();
    expect(updatedTask.logs.length).toBeGreaterThan(0);
    expect(updatedTask.isDue).toBe(false);
  });

  test("snoozes and logs one increment for a count habit reminder", async ({
    page,
  }) => {
    const categoriesRes = await page.request.get("/api/categories");
    expect(categoriesRes.ok()).toBeTruthy();
    const categories = await categoriesRes.json();
    const category = categories[0];
    expect(category?.id).toBeTruthy();

    const name = `Reminder Count Habit ${Date.now()}`;
    const createRes = await page.request.post("/api/habits", {
      data: {
        name,
        categoryId: category.id,
        trackingType: "COUNT",
        thresholdType: "DAILY",
        thresholdValue: 10,
        bucket: "DAY",
        reminderEnabled: true,
        reminderTime: "00:00",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const habit = await createRes.json();

    const snoozeRes = await page.request.post("/api/reminders/actions", {
      data: {
        entityType: "habit",
        entityId: habit.id,
        action: "snooze",
      },
    });
    expect(snoozeRes.ok()).toBeTruthy();

    let habits = await page.request
      .get("/api/habits")
      .then((res) => res.json());
    let updatedHabit = habits.find(
      (item: { id: string }) => item.id === habit.id,
    );
    expect(updatedHabit.reminderSnoozedUntil).toBeTruthy();

    const completeRes = await page.request.post("/api/reminders/actions", {
      data: {
        entityType: "habit",
        entityId: habit.id,
        action: "complete",
      },
    });
    expect(completeRes.ok()).toBeTruthy();

    habits = await page.request.get("/api/habits").then((res) => res.json());
    updatedHabit = habits.find((item: { id: string }) => item.id === habit.id);
    expect(updatedHabit.reminderSnoozedUntil).toBeNull();
    expect(updatedHabit.logs).toHaveLength(1);
    expect(updatedHabit.logs[0].value).toBe(1);
    expect(updatedHabit.logs[0].source).toBe("MANUAL");
  });
});
