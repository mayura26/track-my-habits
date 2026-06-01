import { createHmac, timingSafeEqual } from "node:crypto";

export type ReminderActionEntityType = "task" | "habit";

export const REMINDER_ACTION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

export interface ReminderActionTokenPayload {
  v: 1;
  userId: string;
  subscriptionId: string;
  entityType: ReminderActionEntityType;
  entityId: string;
  expiresAt: number;
}

interface SignReminderActionTokenInput {
  userId: string;
  subscriptionId: string;
  entityType: ReminderActionEntityType;
  entityId: string;
  expiresAt?: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET must be set to sign reminder actions",
    );
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function isReminderActionTokenPayload(
  value: unknown,
): value is ReminderActionTokenPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.v === 1 &&
    typeof payload.userId === "string" &&
    payload.userId.length > 0 &&
    typeof payload.subscriptionId === "string" &&
    payload.subscriptionId.length > 0 &&
    (payload.entityType === "task" || payload.entityType === "habit") &&
    typeof payload.entityId === "string" &&
    payload.entityId.length > 0 &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt)
  );
}

export function signReminderActionToken(
  input: SignReminderActionTokenInput,
): string {
  const payload: ReminderActionTokenPayload = {
    v: 1,
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    entityType: input.entityType,
    entityId: input.entityId,
    expiresAt: input.expiresAt ?? Date.now() + REMINDER_ACTION_TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyReminderActionToken(
  token: string,
): ReminderActionTokenPayload | null {
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return null;

  const expected = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
  } catch {
    return null;
  }

  if (!isReminderActionTokenPayload(payload)) return null;
  if (payload.expiresAt <= Date.now()) return null;
  return payload;
}
