-- Add fields for time-deadline habits.
ALTER TABLE "Habit" ADD COLUMN "deadlineTime" TEXT;
ALTER TABLE "Habit" ADD COLUMN "deadlineGraceMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Habit" ADD COLUMN "reminderLeadMinutes" INTEGER NOT NULL DEFAULT 10;