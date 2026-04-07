-- Add optional weekday selection for tasks.
-- Null keeps backward-compatible behavior (task is eligible on all days).
ALTER TABLE "Task" ADD COLUMN "scheduledWeekdays" TEXT;
