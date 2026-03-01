import { chromium, test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("create test session", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Hit the test session endpoint to create a user + get a session cookie
  await page.goto("http://localhost:3000/api/test/session");

  // Save the auth state (cookies)
  await page.context().storageState({ path: authFile });
  await browser.close();
});
