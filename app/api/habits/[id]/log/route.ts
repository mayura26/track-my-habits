import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { processHabitLog } from "@/lib/gamification";
import { logHabitSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = logHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const loggedAt = parsed.data.loggedAt
    ? new Date(parsed.data.loggedAt)
    : new Date();

  const log = await db.habitLog.create({
    data: {
      habitId: id,
      userId: session.user.id,
      value: parsed.data.value,
      source: parsed.data.source,
      loggedAt,
    },
  });

  const result = await processHabitLog(id, session.user.id, parsed.data.source);

  return NextResponse.json({ log, ...result }, { status: 201 });
}
