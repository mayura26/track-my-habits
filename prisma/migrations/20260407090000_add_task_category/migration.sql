-- Add optional category for tasks (reuses HabitCategory table)
ALTER TABLE "Task" ADD COLUMN "categoryId" TEXT;

-- Index for joins/filtering by category
CREATE INDEX "Task_categoryId_idx" ON "Task"("categoryId");
