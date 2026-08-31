import { z } from "zod";
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

export const createTransferSchema = z.object({
  appointmentId: z.preprocess(parseHashOrNumber, z.number({ message: "Appointment ID is required" })),
  toDoctorId: z.preprocess(parseHashOrNumber, z.number({ message: "Target Doctor ID is required" })),
  toEstablishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
  reason: z.string({ message: "Reason for transfer is required" }).min(3, "Reason must be at least 3 characters"),
});
export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export const updateTransferStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"], {
    message: "Status must be APPROVED, REJECTED, or CANCELLED",
  }),
});

export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
