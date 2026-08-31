import { z } from "zod";
import { AppointmentStatus } from "../../../prisma/interfaces.js";
import hashId from "../../utils/hashId.js";

const parseHashOrNumber = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const decoded = hashId.decodeId(val);
    if (decoded !== null) return decoded;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
};

// Helper function to check if string is a valid ISO date or HH:mm time
const isValidDateOrTime = (val: string) => {
  if (!val || typeof val !== "string") return false;
  if (!isNaN(Date.parse(val))) return true;
  // Match HH:mm or HH:mm:ss
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(val.trim());
};

export const createAppointmentSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object") return raw;
    const copy = { ...raw };

    // 1. Map "date" -> "appointmentDate"
    if (!copy.appointmentDate && copy.date) {
      copy.appointmentDate = copy.date;
    }

    // 2. Map "start_time" or "time" -> "startTime"
    if (!copy.startTime && copy.start_time) {
      copy.startTime = copy.start_time;
    } else if (!copy.startTime && copy.time) {
      copy.startTime = copy.time;
    }

    // 3. Map "end_time" -> "endTime"
    if (!copy.endTime && copy.end_time) {
      copy.endTime = copy.end_time;
    }

    // 4. Map "typeId" or "appointment_type_id" -> "appointmentTypeId"
    if (!copy.appointmentTypeId) {
      if (copy.appointment_type_id) copy.appointmentTypeId = copy.appointment_type_id;
      else if (copy.typeId) copy.appointmentTypeId = copy.typeId;
    }

    // 5. Map "establishment_id" -> "establishmentId"
    if (!copy.establishmentId && copy.establishment_id) {
      copy.establishmentId = copy.establishment_id;
    }

    return copy;
  },
  z.object({
    patientId: z.preprocess(parseHashOrNumber, z.number().optional()),
    doctorId: z.preprocess(parseHashOrNumber, z.number({ message: "Doctor ID is required" })),
    establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
    appointmentTypeId: z.preprocess(parseHashOrNumber, z.number().optional()),
    appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid appointment date (expected YYYY-MM-DD)"),
    startTime: z.string().refine(isValidDateOrTime, "Invalid start time (expected ISO string or HH:mm format)"),
    endTime: z.string().refine(isValidDateOrTime, "Invalid end time (expected ISO string or HH:mm format)"),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }).strip()
);
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
  .object({
    establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
    appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid appointment date").optional(),
    startTime: z.string().refine(isValidDateOrTime, "Invalid start time").optional(),
    endTime: z.string().refine(isValidDateOrTime, "Invalid end time").optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  })
  .strip();
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export const updateAppointmentStatusSchema = z
  .object({
    status: z.nativeEnum(AppointmentStatus),
    notes: z.string().optional(),
  })
  .strip();
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const filterAppointmentQuerySchema = z.object({
  patientId: z.preprocess(parseHashOrNumber, z.number().optional()),
  doctorId: z.preprocess(parseHashOrNumber, z.number().optional()),
  establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
  status: z.nativeEnum(AppointmentStatus).optional(),
  date: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().min(1).default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 10), z.number().min(1).max(100).default(10)),
});
export type FilterAppointmentQueryInput = z.infer<typeof filterAppointmentQuerySchema>;
