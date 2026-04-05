-- AlterTable
ALTER TABLE "Task" ADD COLUMN "bucket" TEXT DEFAULT 'DAY';
ALTER TABLE "Task" ADD COLUMN "minGapDays" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalLogsCount" INTEGER NOT NULL DEFAULT 0,
    "bucketMorningStart" INTEGER NOT NULL DEFAULT 5,
    "bucketDayStart" INTEGER NOT NULL DEFAULT 11,
    "bucketEveningStart" INTEGER NOT NULL DEFAULT 17,
    "bucketBeforeBedStart" INTEGER NOT NULL DEFAULT 21,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "level", "name", "totalLogsCount", "updatedAt", "xp") SELECT "createdAt", "email", "emailVerified", "id", "image", "level", "name", "totalLogsCount", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
