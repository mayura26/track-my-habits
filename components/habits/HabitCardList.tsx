"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { Habit, HabitCategory, HabitLog } from "@prisma/client";
import { HabitCard } from "./HabitCard";

type HabitWithRelations = Habit & {
  category: HabitCategory;
  logs: HabitLog[];
};

interface HabitCardListProps {
  habits: HabitWithRelations[];
  className?: string;
  dimWhenComplete?: boolean;
}

export function HabitCardList({
  habits,
  className,
  dimWhenComplete,
}: HabitCardListProps) {
  const [parent] = useAutoAnimate<HTMLDivElement>({
    duration: 420,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <div ref={parent} className={className}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit as Parameters<typeof HabitCard>[0]["habit"]}
          dimWhenComplete={dimWhenComplete}
        />
      ))}
    </div>
  );
}
