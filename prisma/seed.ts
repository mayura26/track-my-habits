import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Health", color: "#22c55e", icon: "Heart", isDefault: true },
  { name: "Fitness", color: "#f97316", icon: "Dumbbell", isDefault: true },
  { name: "Personal", color: "#a855f7", icon: "User", isDefault: true },
  { name: "Learning", color: "#3b82f6", icon: "BookOpen", isDefault: true },
  { name: "Social", color: "#eab308", icon: "Users", isDefault: true },
];

const defaultBadges = [
  {
    name: "First Step",
    description: "Log your first habit",
    icon: "Footprints",
    condition: JSON.stringify({ type: "totalLogs", value: 1 }),
  },
  {
    name: "Century Club",
    description: "Log 100 habits total",
    icon: "Trophy",
    condition: JSON.stringify({ type: "totalLogs", value: 100 }),
  },
  {
    name: "On Fire",
    description: "Maintain a 3-day streak",
    icon: "Flame",
    condition: JSON.stringify({ type: "maxStreak", value: 3 }),
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "Swords",
    condition: JSON.stringify({ type: "maxStreak", value: 7 }),
  },
  {
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "Crown",
    condition: JSON.stringify({ type: "maxStreak", value: 30 }),
  },
  {
    name: "Organizer",
    description: "Create your first custom category",
    icon: "FolderPlus",
    condition: JSON.stringify({ type: "customCategories", value: 1 }),
  },
  {
    name: "Tech Habit",
    description: "Link your first NFC tag",
    icon: "Nfc",
    condition: JSON.stringify({ type: "nfcTokens", value: 1 }),
  },
  {
    name: "Level 5",
    description: "Reach level 5",
    icon: "Star",
    condition: JSON.stringify({ type: "level", value: 5 }),
  },
  {
    name: "Level 10",
    description: "Reach level 10",
    icon: "Sparkles",
    condition: JSON.stringify({ type: "level", value: 10 }),
  },
  {
    name: "Habit Builder",
    description: "Create 5 habits",
    icon: "LayoutGrid",
    condition: JSON.stringify({ type: "habitCount", value: 5 }),
  },
];

async function main() {
  console.log("Seeding database...");

  for (const category of defaultCategories) {
    await prisma.habitCategory.upsert({
      where: { id: `default-${category.name.toLowerCase()}` },
      update: category,
      create: { id: `default-${category.name.toLowerCase()}`, ...category },
    });
  }

  for (const badge of defaultBadges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
