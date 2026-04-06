-- AlterTable
ALTER TABLE "Task" ADD COLUMN "lastReminderSentAt" DATETIME;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trackingType" TEXT NOT NULL DEFAULT 'BOOLEAN',
    "thresholdType" TEXT NOT NULL DEFAULT 'DAILY',
    "thresholdValue" REAL NOT NULL DEFAULT 1,
    "thresholdWindow" INTEGER,
    "countIncrement" REAL,
    "nfcToken" TEXT,
    "nfcValue" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "lastReminderSentAt" DATETIME,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Habit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HabitCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("bestStreak", "categoryId", "countIncrement", "createdAt", "currentStreak", "description", "id", "isActive", "name", "nfcToken", "nfcValue", "startDate", "thresholdType", "thresholdValue", "thresholdWindow", "trackingType", "updatedAt", "userId") SELECT "bestStreak", "categoryId", "countIncrement", "createdAt", "currentStreak", "description", "id", "isActive", "name", "nfcToken", "nfcValue", "startDate", "thresholdType", "thresholdValue", "thresholdWindow", "trackingType", "updatedAt", "userId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE UNIQUE INDEX "Habit_nfcToken_key" ON "Habit"("nfcToken");
CREATE TABLE "new_HabitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HabitLog" ("createdAt", "habitId", "id", "loggedAt", "source", "userId", "value") SELECT "createdAt", "habitId", "id", "loggedAt", "source", "userId", "value" FROM "HabitLog";
DROP TABLE "HabitLog";
ALTER TABLE "new_HabitLog" RENAME TO "HabitLog";
CREATE INDEX "HabitLog_habitId_idx" ON "HabitLog"("habitId");
CREATE INDEX "HabitLog_userId_idx" ON "HabitLog"("userId");
CREATE INDEX "HabitLog_loggedAt_idx" ON "HabitLog"("loggedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
