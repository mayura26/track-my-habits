import { z } from "zod";

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  trackingType: z.enum(["BOOLEAN", "COUNT"]),
  thresholdType: z.enum(["DAILY", "WEEKLY_TOTAL", "ROLLING_WINDOW"]),
  thresholdValue: z.number().positive(),
  thresholdWindow: z.number().int().positive().optional(),
  countIncrement: z.number().positive().nullable().optional(),
  startDate: z.string().datetime().optional(),
  imageUrl: z.string().nullable().optional(),
  imagePrompt: z.string().max(2000).nullable().optional(),
  reminderEnabled: z.boolean().optional().default(false),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const logHabitSchema = z.object({
  value: z.number().positive().optional().default(1),
  loggedAt: z.string().datetime().optional(),
  source: z.enum(["MANUAL", "NFC", "BACKFILL"]).optional().default("MANUAL"),
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

export const BUCKET_VALUES = [
  "MORNING",
  "DAY",
  "EVENING",
  "BEFORE_BED",
] as const;

export const createTaskSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"]),
  frequencyValue: z.number().int().min(1).max(30),
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
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
