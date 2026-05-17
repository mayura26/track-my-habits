import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { HabitResetError, resetHabit } from "@/lib/habit-reset";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });
  const timezone = user?.timezone ?? "UTC";

  try {
    await resetHabit(id, session.user.id, timezone);
  } catch (err) {
    if (err instanceof HabitResetError && err.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}
