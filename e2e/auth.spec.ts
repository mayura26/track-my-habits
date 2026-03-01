import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated visit to /dashboard redirects to /signin", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("sign-in page renders with Google button", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByText("Track My Habits")).toBeVisible();
    await expect(page.getByText(/Sign in with Google/i)).toBeVisible();
  });

  test("/nfc/[token] is accessible without auth", async ({ page }) => {
    const response = await page.goto("/nfc/INVALID00");
    // Should render (not redirect to signin) — could be error page or success
    await expect(page).not.toHaveURL(/\/signin/);
  });
});
