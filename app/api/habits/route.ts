import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createHabitSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const habits = await db.habit.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      category: true,
      logs: { orderBy: { loggedAt: "desc" }, take: 30 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { startDate: startDateStr, ...rest } = parsed.data;
  const habit = await db.habit.create({
    data: {
      userId: session.user.id,
      ...rest,
      ...(startDateStr ? { startDate: new Date(startDateStr) } : {}),
    },
    include: { category: true },
  });

  return NextResponse.json(habit, { status: 201 });
}
