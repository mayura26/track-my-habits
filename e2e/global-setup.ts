import fs from "node:fs";
import path from "node:path";
import { chromium, test as setup } from "@playwright/test";

const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "user.json");

// Routes to pre-warm so Next.js compiles them before tests start.
// First request to each route takes 10-30 s in dev mode.
const ROUTES_TO_WARM = [
  "/signin",
  "/dashboard",
  "/habits",
  "/habits/new",
  "/categories",
  "/stats",
  "/achievements",
  "/tasks",
  "/tasks/new",
  "/settings",
  "/nfc/WARMUP_INVALID",
];

setup("create test session", async () => {
  fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // --- 1. Create auth session ---
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

  // --- 2. Save auth state ---
  const storageState = await page.context().storageState();
  await page.context().storageState({ path: authFile });

  // Extract session cookie for node fetch warm-up requests
  const sessionCookie = storageState.cookies.find((c) =>
    c.name.startsWith("authjs."),
  );
  const cookieHeader = sessionCookie
    ? `${sessionCookie.name}=${sessionCookie.value}`
    : "";

  // --- 3. Pre-warm routes in parallel using Node fetch ---
  await Promise.allSettled(
    ROUTES_TO_WARM.map((route) =>
      fetch(`http://localhost:3000${route}`, {
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
        signal: AbortSignal.timeout(90_000),
      }).catch(() => null),
    ),
  );

  await browser.close();
});
