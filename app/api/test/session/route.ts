import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Only available in test environment
export async function GET() {
  if (process.env.TEST_AUTH_BYPASS !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const testUser = await db.user.upsert({
    where: { email: "test@playwright.dev" },
    update: {},
    create: {
      email: "test@playwright.dev",
      name: "Test User",
      emailVerified: new Date(),
    },
  });

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await db.session.create({
    data: {
      userId: testUser.id,
      sessionToken: `test-session-${Date.now()}`,
      expires,
    },
  });

  const response = NextResponse.json({ ok: true, userId: testUser.id });
  response.cookies.set("authjs.session-token", session.sessionToken, {
    httpOnly: true,
    expires,
    path: "/",
  });

  return response;
}
