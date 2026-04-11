/**
 * Reminder cron runner.
 *
 * Usage:
 *   npm run cron:reminders
 */
const BASE_URL = (
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/+$/, "");
const SECRET = process.env.CRON_SECRET ?? "cron-secret-change-me";

async function tick() {
  const res = await fetch(`${BASE_URL}/api/cron/reminders`, {
    headers: {
      Authorization: `Bearer ${SECRET}`,
      Accept: "application/json",
    },
  });
  const contentType = res.headers.get("content-type") ?? "";
  const rawBody = await res.text();
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const bodyPreview = rawBody.slice(0, 200).replace(/\s+/g, " ").trim();
    throw new Error(
      `Request failed (${res.status} ${res.statusText}) from ${BASE_URL}/api/cron/reminders. Content-Type: ${contentType || "unknown"}. Body preview: ${bodyPreview}`,
    );
  }

  if (!isJson) {
    const bodyPreview = rawBody.slice(0, 200).replace(/\s+/g, " ").trim();
    throw new Error(
      `Expected JSON but received "${contentType || "unknown"}" from ${BASE_URL}/api/cron/reminders. Body preview: ${bodyPreview}`,
    );
  }

  const data = JSON.parse(rawBody) as { checked?: number; sent?: number };
  console.log(
    `[${new Date().toLocaleTimeString()}] Checked ${data.checked ?? 0} reminders, sent ${data.sent ?? 0} push notifications`,
  );
}

async function main() {
  try {
    await tick();
    process.exitCode = 0;
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Reminder check failed:`,
      err,
    );
    process.exitCode = 1;
  }
}

void main();
