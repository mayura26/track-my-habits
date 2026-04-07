import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { serializeScheduledWeekdays } from "@/lib/task-helpers";
import { updateTaskSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, userId: session.user.id },
    include: { logs: { orderBy: { completedAt: "desc" }, take: 50 } },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.task.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.categoryId !== undefined) {
    if (parsed.data.categoryId) {
      const category = await db.habitCategory.findFirst({
        where: {
          id: parsed.data.categoryId,
          OR: [{ isDefault: true }, { userId: session.user.id }],
        },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json(
          { error: { formErrors: ["Invalid category"] } },
          { status: 400 },
        );
      }
    }
  }

  const { scheduledWeekdays, ...restData } = parsed.data;
  const updateData: Prisma.TaskUncheckedUpdateInput = {
    ...restData,
    ...(scheduledWeekdays !== undefined
      ? {
          scheduledWeekdays: serializeScheduledWeekdays(scheduledWeekdays),
        }
      : {}),
  };

  const task = await db.task.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.task.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-delete
  await db.task.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ success: true });
}
