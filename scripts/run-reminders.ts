/**
 * Reminder cron runner — polls /api/cron/reminders every 15 minutes.
 * Usage: npm run cron:reminders
 */

const INTERVAL_MS = 15 * 60 * 1000;
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const SECRET = process.env.CRON_SECRET ?? "cron-secret-change-me";

async function tick() {
  try {
    const res = await fetch(`${BASE_URL}/api/cron/reminders`, {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const data = await res.json();
    console.log(
      `[${new Date().toLocaleTimeString()}] Checked ${data.checked ?? 0} reminders, sent ${data.sent ?? 0} push notifications`,
    );
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Reminder check failed:`, err);
  }
}

console.log("Reminder cron started — checking every 15 minutes");
tick();
setInterval(tick, INTERVAL_MS);
