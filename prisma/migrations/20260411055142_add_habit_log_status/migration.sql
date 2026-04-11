-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HabitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HabitLog" ("createdAt", "habitId", "id", "loggedAt", "source", "userId", "value", "xpAwarded") SELECT "createdAt", "habitId", "id", "loggedAt", "source", "userId", "value", "xpAwarded" FROM "HabitLog";
DROP TABLE "HabitLog";
ALTER TABLE "new_HabitLog" RENAME TO "HabitLog";
CREATE INDEX "HabitLog_habitId_idx" ON "HabitLog"("habitId");
CREATE INDEX "HabitLog_userId_idx" ON "HabitLog"("userId");
CREATE INDEX "HabitLog_loggedAt_idx" ON "HabitLog"("loggedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
