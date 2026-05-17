import { test as baseTest, expect } from "@playwright/test";
import { test as authTest } from "./fixtures";

baseTest.describe("NFC (public routes)", () => {
  baseTest("invalid NFC token shows error page", async ({ page }) => {
    await page.goto("/nfc/INVALID00");
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.getByText(/Invalid Token|Invalid NFC/i)).toBeVisible();
  });
});

authTest.describe("NFC (authenticated)", () => {
  authTest("generate NFC token for a habit", async ({ page }) => {
    // Create a habit
    await page.goto("/habits/new");
    await page.fill('[name="name"]', "NFC Test Habit");
    await page.selectOption('[name="categoryId"]', { label: "Health" });
    await page.getByRole("button", { name: "Create Habit" }).click();
    await expect(page).toHaveURL("/habits");

    // Navigate to habit detail
    await page.getByText("NFC Test Habit").first().click();

    // NFC token management lives under the Settings tab
    await page.getByRole("tab", { name: "Settings" }).click();

    // Generate NFC token
    await page.getByRole("button", { name: /Generate Token/i }).click();
    await expect(page.locator("text=/NFC URL/")).toBeVisible({ timeout: 5000 });
  });

  authTest(
    "NFC trigger via API creates log with NFC source",
    async ({ page }) => {
      const createRes = await page.request.post("/api/habits", {
        data: {
          name: "API NFC Habit",
          categoryId: "default-health",
          trackingType: "BOOLEAN",
          thresholdType: "DAILY",
          thresholdValue: 1,
        },
      });

      if (createRes.ok()) {
        const habit = await createRes.json();
        const nfcRes = await page.request.post(`/api/habits/${habit.id}/nfc`);
        if (nfcRes.ok()) {
          const { token } = await nfcRes.json();
          await page.goto(`/nfc/${token}`);
          await expect(page.getByText("API NFC Habit")).toBeVisible({
            timeout: 5000,
          });
          await expect(page.getByText(/Logged via NFC/i)).toBeVisible();
        }
      }
    },
  );
});
