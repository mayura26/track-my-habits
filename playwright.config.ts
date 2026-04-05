import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/db-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      timeout: 300_000,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile-shell\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      testMatch: /mobile-shell\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      TEST_AUTH_BYPASS: "true",
      NEXTAUTH_SECRET: "test-secret-for-playwright",
      NEXTAUTH_URL: "http://localhost:3000",
    },
  },
});
