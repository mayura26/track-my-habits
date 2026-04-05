import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { awardXP } from "@/lib/gamification";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, userId: session.user.id, isActive: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const log = await db.taskLog.create({
    data: {
      taskId: id,
      userId: session.user.id,
    },
  });

  await awardXP(session.user.id, 10);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true },
  });

  return NextResponse.json({ log, xp: user?.xp, level: user?.level }, { status: 201 });
}
