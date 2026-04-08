import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await sendPushToUser(session.user.id, {
    title: "Test Notification",
    body: "Push notifications are working!",
    url: "/dashboard",
  });

  return NextResponse.json({ sent: count });
}
