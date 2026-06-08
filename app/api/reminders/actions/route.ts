import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { performReminderAction } from "@/lib/reminder-action-handler";
import { reminderActionSchema } from "@/lib/validations";

function parseReminderActionRequest(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const queryBody = {
    entityType: searchParams.get("entityType") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    actionToken: searchParams.get("actionToken") ?? undefined,
  };

  return { queryBody };
}

async function parseReminderActionBody(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return body;
}

function mergeReminderActionInput(
  body: Record<string, unknown>,
  queryBody: Record<string, string | undefined>,
) {
  return {
    ...body,
    ...Object.fromEntries(
      Object.entries(queryBody).filter(([, value]) => value !== undefined),
    ),
  };
}

export async function POST(req: NextRequest) {
  const { queryBody } = parseReminderActionRequest(req);
  const body = await parseReminderActionBody(req);
  const parsed = reminderActionSchema.safeParse(
    mergeReminderActionInput(body, queryBody),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const session = await auth();
  const outcome = await performReminderAction({
    ...parsed.data,
    userId: session?.user?.id ?? null,
  });

  if (!outcome.ok) {
    const status = outcome.error === "unauthorized" ? 401 : 404;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome);
}
