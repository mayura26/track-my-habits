-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "bucket" TEXT DEFAULT 'DAY';
ALTER TABLE "Habit" ADD COLUMN "scheduledWeekdays" TEXT;
