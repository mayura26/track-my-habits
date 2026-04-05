import path from "node:path";
import { test as base } from "@playwright/test";

const authFile = path.join(__dirname, ".auth/user.json");

export const test = base.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
