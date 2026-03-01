import { z } from "zod";

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  trackingType: z.enum(["BOOLEAN", "COUNT"]),
  thresholdType: z.enum(["DAILY", "WEEKLY_TOTAL", "ROLLING_WINDOW"]),
  thresholdValue: z.number().positive(),
  thresholdWindow: z.number().int().positive().optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const logHabitSchema = z.object({
  value: z.number().positive().optional().default(1),
  loggedAt: z.string().datetime().optional(),
  source: z.enum(["MANUAL", "NFC"]).optional().default("MANUAL"),
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
