import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const category = await db.habitCategory.findFirst({
    where: { id, userId: session.user.id, isDefault: false },
    include: { habits: { take: 1 } },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Not found or cannot delete default categories" },
      { status: 404 },
    );
  }

  if (category.habits.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with habits" },
      { status: 400 },
    );
  }

  await db.habitCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
