import { chromium, test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "user.json");

setup("create test session", async () => {
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Hit the test session endpoint to create a user + get a session cookie
  await page.goto("http://localhost:3000/api/test/session");

  const body = await page.evaluate(() => {
    try {
      return JSON.parse(document.body.innerText);
    } catch {
      return null;
    }
  });

  if (!body?.ok) {
    await browser.close();
    throw new Error(
      `[global-setup] Auth bypass failed. Response: ${JSON.stringify(body)}\n` +
        "Make sure TEST_AUTH_BYPASS=true is set and the server is running.",
    );
  }

  // Save the auth state (cookies)
  await page.context().storageState({ path: authFile });
  await browser.close();
});
