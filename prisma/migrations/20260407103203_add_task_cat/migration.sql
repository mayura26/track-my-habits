-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "frequencyValue" INTEGER NOT NULL DEFAULT 1,
    "scheduledWeekdays" TEXT,
    "bucket" TEXT DEFAULT 'DAY',
    "minGapDays" INTEGER,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "lastReminderSentAt" DATETIME,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HabitCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("bucket", "categoryId", "createdAt", "description", "frequency", "frequencyValue", "id", "imagePrompt", "imageUrl", "isActive", "lastReminderSentAt", "minGapDays", "name", "reminderEnabled", "reminderTime", "scheduledWeekdays", "updatedAt", "userId") SELECT "bucket", "categoryId", "createdAt", "description", "frequency", "frequencyValue", "id", "imagePrompt", "imageUrl", "isActive", "lastReminderSentAt", "minGapDays", "name", "reminderEnabled", "reminderTime", "scheduledWeekdays", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_categoryId_idx" ON "Task"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
