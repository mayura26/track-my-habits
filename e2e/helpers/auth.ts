import { request } from "@playwright/test";

/**
 * Portable auth helper for the TEST_AUTH_BYPASS flow.
 * Returns a Playwright storageState object that can be passed to
 * `browser.newContext({ storageState })` in ad-hoc scripts.
 *
 * Usage in a /tmp playwright script:
 *   import { getTestAuthState } from "<path-to>/e2e/helpers/auth";
 *   const state = await getTestAuthState();
 *   const ctx = await browser.newContext({ storageState: state });
 */
export async function getTestAuthState(baseURL = "http://localhost:3000") {
  const apiContext = await request.newContext({ baseURL });

  const response = await apiContext.get("/api/test/session");
  if (!response.ok()) {
    await apiContext.dispose();
    throw new Error(
      `[auth helper] Auth bypass failed (HTTP ${response.status()}): ${await response.text()}`,
    );
  }

  const body = await response.json();
  if (!body?.ok) {
    await apiContext.dispose();
    throw new Error(
      `[auth helper] Session endpoint returned unexpected body: ${JSON.stringify(body)}`,
    );
  }

  const state = await apiContext.storageState();
  await apiContext.dispose();
  return state;
}
