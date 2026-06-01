import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(__dirname, "..");
// Match the webServer's DATABASE_URL exactly. Prisma resolves "./" relative
// to the schema.prisma directory, so this points at prisma/prisma/test.db
// on disk — the same file the dev server opens.
const DB_URL = "file:./prisma/test.db";

export default async function dbSetup() {
  const env = { ...process.env, DATABASE_URL: DB_URL };
  const opts = { cwd: ROOT, env, stdio: "inherit" as const };

  console.log("[db-setup] Running prisma migrate deploy against test.db...");
  execSync("npx prisma migrate deploy", opts);

  // Explicitly delete all user-generated data in dependency order.
  // SQLite requires PRAGMA foreign_keys = ON per connection for CASCADE to fire;
  // rather than rely on that, we delete each table manually in safe order.
  console.log("[db-setup] Cleaning up test data from previous runs...");
  const db = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  try {
    await db.taskLog.deleteMany({});
    await db.task.deleteMany({});
    await db.habitLog.deleteMany({});
    await db.userBadge.deleteMany({});
    await db.pushSubscription.deleteMany({});
    await db.session.deleteMany({});
    await db.account.deleteMany({});
    await db.habit.deleteMany({});
    await db.habitCategory.deleteMany({ where: { isDefault: false } });
    await db.user.deleteMany({});
  } finally {
    await db.$disconnect();
  }

  console.log("[db-setup] Running prisma db seed against test.db...");
  execSync("npx prisma db seed", opts);

  console.log("[db-setup] Test DB ready.");
}
