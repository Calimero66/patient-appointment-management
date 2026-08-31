import { z } from "zod";

const isValidTime = (val: string) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val.trim());
};

export const updateWeeklyScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().refine(isValidTime, "Invalid startTime (expected HH:mm)"),
      endTime: z.string().refine(isValidTime, "Invalid endTime (expected HH:mm)"),
      isActive: z.boolean().default(true),
    })
  ).min(1, "At least one day schedule is required"),
});

export type UpdateWeeklyScheduleInput = z.infer<typeof updateWeeklyScheduleSchema>;

export const createScheduleExceptionSchema = z
  .object({
    exceptionDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date (expected YYYY-MM-DD)")
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid startDate (expected YYYY-MM-DD)")
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid endDate (expected YYYY-MM-DD)")
      .optional(),
    type: z.enum(
      [
        "ABSENCE",
        "VACATION",
        "HOLIDAY",
        "UNAVAILABLE",
        "SICK_LEAVE",
        "CONFERENCE",
        "TRAINING",
        "PERSONAL",
      ],
      {
        message: "Type must be one of: ABSENCE, VACATION, HOLIDAY, UNAVAILABLE, SICK_LEAVE, CONFERENCE, TRAINING, PERSONAL",
      }
    ),
    reason: z.string().max(500, "Reason must be under 500 characters").optional(),
    force: z.boolean().optional().default(false),
  })
  .refine(
    (data) => Boolean(data.exceptionDate || (data.startDate && data.endDate)),
    {
      message: "Please provide either exceptionDate (single day) or both startDate and endDate (date range)",
    }
  );

export type CreateScheduleExceptionInput = z.infer<typeof createScheduleExceptionSchema>;
