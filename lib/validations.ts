import { z } from "zod";

import { TIME_DEADLINE_TRACKING_TYPE } from "@/lib/habit-deadline";

const supportedTimeZones =
  typeof Intl.supportedValuesOf === "function"
    ? new Set(Intl.supportedValuesOf("timeZone"))
    : null;

const timezoneSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      supportedTimeZones ? supportedTimeZones.has(value) : value.includes("/"),
    "Invalid timezone",
  );

export const BUCKET_VALUES = [
  "MORNING",
  "DAY",
  "EVENING",
  "BEFORE_BED",
] as const;
export const WEEKDAY_VALUES = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const;

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const habitSchemaBase = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  trackingType: z.enum(["BOOLEAN", "COUNT", TIME_DEADLINE_TRACKING_TYPE]),
  thresholdType: z.enum(["DAILY", "WEEKLY_TOTAL", "ROLLING_WINDOW"]),
  thresholdValue: z.number().positive(),
  thresholdWindow: z.number().int().positive().optional(),
  countIncrement: z.number().positive().nullable().optional(),
  startDate: z.string().datetime().optional(),
  imageUrl: z.string().nullable().optional(),
  imagePrompt: z.string().max(2000).nullable().optional(),
  scheduledWeekdays: z
    .array(z.enum(WEEKDAY_VALUES))
    .min(1)
    .max(7)
    .optional()
    .transform((value) => (value ? [...new Set(value)] : value)),
  // No Zod default — `.partial()` for updates keeps defaults, which would
  // reset an omitted bucket. The Prisma column default ("DAY") covers create.
  bucket: z.enum(BUCKET_VALUES).optional(),
  deadlineTime: timeStringSchema.nullable().optional(),
  deadlineGraceMinutes: z.number().int().min(0).max(240).optional(),
  reminderLeadMinutes: z.number().int().min(0).max(1440).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: timeStringSchema.optional(),
});

function addDeadlineRequirementIssue(
  ctx: z.RefinementCtx,
  path: string[],
  message: string,
) {
  ctx.addIssue({ code: "custom", path, message });
}

export const createHabitSchema = habitSchemaBase
  .superRefine((data, ctx) => {
    if (
      data.trackingType === TIME_DEADLINE_TRACKING_TYPE &&
      !data.deadlineTime
    ) {
      addDeadlineRequirementIssue(
        ctx,
        ["deadlineTime"],
        "Deadline time is required",
      );
    }
  })
  .transform((data) => {
    if (data.trackingType !== TIME_DEADLINE_TRACKING_TYPE) {
      return {
        ...data,
        reminderEnabled: data.reminderEnabled ?? false,
        deadlineTime: null,
        deadlineGraceMinutes: 0,
        reminderLeadMinutes: 10,
      };
    }

    return {
      ...data,
      thresholdType: "DAILY" as const,
      thresholdValue: 1,
      thresholdWindow: undefined,
      countIncrement: null,
      deadlineGraceMinutes: data.deadlineGraceMinutes ?? 0,
      reminderLeadMinutes: data.reminderLeadMinutes ?? 10,
      reminderEnabled: data.reminderEnabled ?? true,
      reminderTime: undefined,
    };
  });

export const updateHabitSchema = habitSchemaBase
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.trackingType === TIME_DEADLINE_TRACKING_TYPE &&
      !data.deadlineTime
    ) {
      addDeadlineRequirementIssue(
        ctx,
        ["deadlineTime"],
        "Deadline time is required",
      );
    }
  })
  .transform((data) => {
    if (data.trackingType !== TIME_DEADLINE_TRACKING_TYPE) return data;

    return {
      ...data,
      thresholdType: "DAILY" as const,
      thresholdValue: 1,
      thresholdWindow: null,
      countIncrement: null,
      deadlineGraceMinutes: data.deadlineGraceMinutes ?? 0,
      reminderLeadMinutes: data.reminderLeadMinutes ?? 10,
      reminderEnabled: data.reminderEnabled ?? true,
      reminderTime: undefined,
    };
  });
export const logHabitSchema = z.object({
  // Omitted value is treated as 1 in the log route (explicit 0 is allowed).
  value: z.number().min(0).optional(),
  loggedAt: z.string().datetime().optional(),
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  source: z.enum(["MANUAL", "NFC", "BACKFILL"]).optional().default("MANUAL"),
  status: z.enum(["COMPLETED", "FAILED"]).optional().default("COMPLETED"),
  // When true (BACKFILL only), delete all existing logs for the day first,
  // then create the new log. Used by the COUNT history editor to "set the
  // day's total to exactly N" in one atomic step.
  replace: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(50),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type LogHabitInput = z.infer<typeof logHabitSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const createTaskSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]),
  frequencyValue: z.number().int().min(1).max(30),
  scheduledWeekdays: z
    .array(z.enum(WEEKDAY_VALUES))
    .min(1)
    .max(7)
    .optional()
    .transform((value) => (value ? [...new Set(value)] : value)),
  bucket: z.enum(BUCKET_VALUES).optional().default("DAY"),
  minGapDays: z.number().int().min(0).max(365).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imagePrompt: z.string().max(2000).nullable().optional(),
  reminderEnabled: z.boolean().optional().default(false),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  timezone: timezoneSchema,
  bucketMorningStart: z.number().int().min(0).max(23),
  bucketDayStart: z.number().int().min(0).max(23),
  bucketEveningStart: z.number().int().min(0).max(23),
  bucketBeforeBedStart: z.number().int().min(0).max(23),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  platform: z.enum(["android", "desktop", "ios"]).optional(),
});

export const reminderActionSchema = z.object({
  entityType: z.enum(["task", "habit", "test"]),
  entityId: z.string().min(1),
  action: z.enum(["complete", "snooze"]),
  actionToken: z.string().min(1).optional(),
});

export const reminderActionTokenSchema = z.object({
  entityType: z.enum(["task", "habit"]),
  entityId: z.string().min(1),
  subscriptionEndpoint: z.string().url().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ReminderActionInput = z.infer<typeof reminderActionSchema>;
export type ReminderActionTokenInput = z.infer<
  typeof reminderActionTokenSchema
>;
