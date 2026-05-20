-- Add durable snooze state for task and habit reminders.
ALTER TABLE "Habit" ADD COLUMN "reminderSnoozedUntil" DATETIME;
ALTER TABLE "Task" ADD COLUMN "reminderSnoozedUntil" DATETIME;
