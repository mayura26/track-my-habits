"use client";

import type { HabitLog } from "@prisma/client";
import { HabitCountLogControl } from "./HabitCountLogControl";

interface HabitDetailCountSectionProps {
  habitId: string;
  logs: HabitLog[];
  thresholdValue: number;
  countIncrement: number | null;
}

export function HabitDetailCountSection({
  habitId,
  logs,
  thresholdValue,
  countIncrement,
}: HabitDetailCountSectionProps) {
  return (
    <HabitCountLogControl
      habitId={habitId}
      logs={logs}
      thresholdValue={thresholdValue}
      countIncrement={countIncrement}
    />
  );
}
