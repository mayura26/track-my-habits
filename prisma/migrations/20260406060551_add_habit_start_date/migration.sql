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
    "nfcToken" TEXT,
    "nfcValue" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Habit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HabitCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("bestStreak", "categoryId", "createdAt", "currentStreak", "description", "id", "isActive", "name", "nfcToken", "nfcValue", "thresholdType", "thresholdValue", "thresholdWindow", "trackingType", "updatedAt", "userId") SELECT "bestStreak", "categoryId", "createdAt", "currentStreak", "description", "id", "isActive", "name", "nfcToken", "nfcValue", "thresholdType", "thresholdValue", "thresholdWindow", "trackingType", "updatedAt", "userId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE UNIQUE INDEX "Habit_nfcToken_key" ON "Habit"("nfcToken");
-- Backfill: existing habits should start from their creation date, not migration time
UPDATE "Habit" SET "startDate" = "createdAt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
