import { type Page, request } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { signReminderActionToken } from "../lib/reminder-action-token";
import { expect, test } from "./fixtures";

const TEST_BASE_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret-for-playwright";

const testDb = new PrismaClient({
  datasources: { db: { url: "file:./prisma/test.db" } },
});

async function getTestUserId() {
  const user = await testDb.user.findUniqueOrThrow({
    where: { email: "test@playwright.dev" },
    select: { id: true },
  });
  return user.id;
}

async function createPushSubscription(userId: string) {
  return testDb.pushSubscription.create({
    data: {
      userId,
      endpoint: `https://push.example.test/${Date.now()}-${Math.random()}`,
      p256dh: "test-p256dh",
      auth: "test-auth",
    },
  });
}

async function createCountHabit(page: Page) {
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
  return createRes.json();
}

test.describe("Reminder notification actions", () => {
  test("snoozes and finishes a multi-count task reminder", async ({ page }) => {
    const name = `Reminder Task ${Date.now()}`;
    const createRes = await page.request.post("/api/tasks", {
      data: {
        name,
        frequency: "DAILY",
        frequencyValue: 3,
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
    expect(updatedTask.logs).toHaveLength(3);
    expect(updatedTask.isDue).toBe(false);

    const secondCompleteRes = await page.request.post(
      "/api/reminders/actions",
      {
        data: {
          entityType: "task",
          entityId: task.id,
          action: "complete",
        },
      },
    );
    expect(secondCompleteRes.ok()).toBeTruthy();

    tasks = await page.request.get("/api/tasks").then((res) => res.json());
    updatedTask = tasks.find((item: { id: string }) => item.id === task.id);
    expect(updatedTask.logs).toHaveLength(3);
  });

  test("snoozes and finishes a count habit reminder", async ({ page }) => {
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
    expect(updatedHabit.logs[0].value).toBe(10);
    expect(updatedHabit.logs[0].source).toBe("MANUAL");

    const secondCompleteRes = await page.request.post(
      "/api/reminders/actions",
      {
        data: {
          entityType: "habit",
          entityId: habit.id,
          action: "complete",
        },
      },
    );
    expect(secondCompleteRes.ok()).toBeTruthy();

    habits = await page.request.get("/api/habits").then((res) => res.json());
    updatedHabit = habits.find((item: { id: string }) => item.id === habit.id);
    expect(updatedHabit.logs).toHaveLength(1);
    const todaySum = updatedHabit.logs.reduce(
      (sum: number, log: { value: number }) => sum + log.value,
      0,
    );
    expect(todaySum).toBeGreaterThanOrEqual(10);
  });

  test("completes a habit reminder with a valid action token and no session", async ({
    page,
  }) => {
    const habit = await createCountHabit(page);
    const userId = await getTestUserId();
    const subscription = await createPushSubscription(userId);
    const actionToken = signReminderActionToken({
      userId,
      subscriptionId: subscription.id,
      entityType: "habit",
      entityId: habit.id,
    });
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const completeRes = await unauthenticated.post("/api/reminders/actions", {
        data: {
          entityType: "habit",
          entityId: habit.id,
          action: "complete",
          actionToken,
        },
      });
      expect(completeRes.ok()).toBeTruthy();
    } finally {
      await unauthenticated.dispose();
    }

    const habits = await page.request
      .get("/api/habits")
      .then((res) => res.json());
    const updatedHabit = habits.find(
      (item: { id: string }) => item.id === habit.id,
    );
    expect(updatedHabit.logs).toHaveLength(1);
    expect(updatedHabit.logs[0].value).toBe(10);
  });

  test("completes a local habit reminder token with no session", async ({
    page,
  }) => {
    const habit = await createCountHabit(page);
    const tokenRes = await page.request.post("/api/reminders/action-token", {
      data: {
        entityType: "habit",
        entityId: habit.id,
      },
    });
    expect(tokenRes.ok()).toBeTruthy();
    const { actionToken } = await tokenRes.json();
    expect(actionToken).toBeTruthy();

    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const completeRes = await unauthenticated.post("/api/reminders/actions", {
        data: {
          entityType: "habit",
          entityId: habit.id,
          action: "complete",
          actionToken,
        },
      });
      expect(completeRes.ok()).toBeTruthy();
    } finally {
      await unauthenticated.dispose();
    }

    const habits = await page.request
      .get("/api/habits")
      .then((res) => res.json());
    const updatedHabit = habits.find(
      (item: { id: string }) => item.id === habit.id,
    );
    expect(updatedHabit.logs).toHaveLength(1);
    expect(updatedHabit.logs[0].value).toBe(10);
  });

  test("completes a local habit reminder action URL with no session", async ({
    page,
  }) => {
    const habit = await createCountHabit(page);
    const tokenRes = await page.request.post("/api/reminders/action-token", {
      data: {
        entityType: "habit",
        entityId: habit.id,
      },
    });
    expect(tokenRes.ok()).toBeTruthy();
    const { actionUrls } = await tokenRes.json();
    expect(actionUrls?.complete).toContain("/api/reminders/actions?");
    expect(actionUrls?.complete).toContain("action=complete");

    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const completeRes = await unauthenticated.post(actionUrls.complete);
      expect(completeRes.ok()).toBeTruthy();
    } finally {
      await unauthenticated.dispose();
    }

    const habits = await page.request
      .get("/api/habits")
      .then((res) => res.json());
    const updatedHabit = habits.find(
      (item: { id: string }) => item.id === habit.id,
    );
    expect(updatedHabit.logs).toHaveLength(1);
    expect(updatedHabit.logs[0].value).toBe(10);
  });

  test("snoozes a task reminder with a valid action token and no session", async ({
    page,
  }) => {
    const name = `Token Snooze Task ${Date.now()}`;
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
    const userId = await getTestUserId();
    const subscription = await createPushSubscription(userId);
    const actionToken = signReminderActionToken({
      userId,
      subscriptionId: subscription.id,
      entityType: "task",
      entityId: task.id,
    });
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const snoozeRes = await unauthenticated.post("/api/reminders/actions", {
        data: {
          entityType: "task",
          entityId: task.id,
          action: "snooze",
          actionToken,
        },
      });
      expect(snoozeRes.ok()).toBeTruthy();
    } finally {
      await unauthenticated.dispose();
    }

    const tasks = await page.request
      .get("/api/tasks")
      .then((res) => res.json());
    const updatedTask = tasks.find(
      (item: { id: string }) => item.id === task.id,
    );
    expect(updatedTask.reminderSnoozedUntil).toBeTruthy();
  });

  test("confirms test notification buttons with no session", async () => {
    const userId = await getTestUserId();
    const subscription = await createPushSubscription(userId);
    const actionToken = signReminderActionToken({
      userId,
      subscriptionId: subscription.id,
      entityType: "test",
      entityId: "notification-action-test",
    });
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      for (const action of ["complete", "snooze"] as const) {
        const response = await unauthenticated.post("/api/reminders/actions", {
          data: {
            entityType: "test",
            entityId: "notification-action-test",
            action,
            actionToken,
          },
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.result.confirmed).toBe(true);
        expect(body.result.message).toContain(
          action === "complete" ? "Done" : "Snooze",
        );
      }
    } finally {
      await unauthenticated.dispose();
    }
  });

  test("rejects missing or invalid action tokens without a session", async () => {
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const missingTokenRes = await unauthenticated.post(
        "/api/reminders/actions",
        {
          data: {
            entityType: "habit",
            entityId: "missing-token-habit",
            action: "complete",
          },
        },
      );
      expect(missingTokenRes.status()).toBe(401);

      const invalidTokenRes = await unauthenticated.post(
        "/api/reminders/actions",
        {
          data: {
            entityType: "habit",
            entityId: "invalid-token-habit",
            action: "complete",
            actionToken: "not-a-valid-token",
          },
        },
      );
      expect(invalidTokenRes.status()).toBe(401);
    } finally {
      await unauthenticated.dispose();
    }
  });

  test("rejects expired action tokens without a session", async ({ page }) => {
    const habit = await createCountHabit(page);
    const userId = await getTestUserId();
    const subscription = await createPushSubscription(userId);
    const actionToken = signReminderActionToken({
      userId,
      subscriptionId: subscription.id,
      entityType: "habit",
      entityId: habit.id,
      expiresAt: Date.now() - 1000,
    });
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const completeRes = await unauthenticated.post("/api/reminders/actions", {
        data: {
          entityType: "habit",
          entityId: habit.id,
          action: "complete",
          actionToken,
        },
      });
      expect(completeRes.status()).toBe(401);
    } finally {
      await unauthenticated.dispose();
    }
  });

  test("rejects action tokens for a different entity", async ({ page }) => {
    const firstHabit = await createCountHabit(page);
    const secondHabit = await createCountHabit(page);
    const userId = await getTestUserId();
    const subscription = await createPushSubscription(userId);
    const actionToken = signReminderActionToken({
      userId,
      subscriptionId: subscription.id,
      entityType: "habit",
      entityId: firstHabit.id,
    });
    const unauthenticated = await request.newContext({
      baseURL: TEST_BASE_URL,
    });

    try {
      const completeRes = await unauthenticated.post("/api/reminders/actions", {
        data: {
          entityType: "habit",
          entityId: secondHabit.id,
          action: "complete",
          actionToken,
        },
      });
      expect(completeRes.status()).toBe(401);
    } finally {
      await unauthenticated.dispose();
    }

    const habits = await page.request
      .get("/api/habits")
      .then((res) => res.json());
    const updatedSecondHabit = habits.find(
      (item: { id: string }) => item.id === secondHabit.id,
    );
    expect(updatedSecondHabit.logs).toHaveLength(0);
  });
});
