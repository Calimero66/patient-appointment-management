import { Appointment } from "../../../prisma/interfaces.js";
import hashId from "../../utils/hashId.js";
import { userDto } from "../user/user.dto.js";
import { establishmentDto } from "../establishment/establishment.dto.js";

export const appointmentDto = (appointment: Appointment) => {
  return {
    id: hashId.encodeId(appointment.id),
    patientId: hashId.encodeId(appointment.patientId),
    doctorId: hashId.encodeId(appointment.doctorId),
    establishmentId: appointment.establishmentId ? hashId.encodeId(appointment.establishmentId) : undefined,
    appointmentTypeId: hashId.encodeId(appointment.appointmentTypeId),
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    reason: appointment.reason ?? null,
    notes: appointment.notes ?? null,
    createdBy: hashId.encodeId(appointment.createdBy),
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    patient: (appointment as any).patient ? userDto((appointment as any).patient) : undefined,
    doctor: (appointment as any).doctor ? userDto((appointment as any).doctor) : undefined,
    establishment: (appointment as any).establishment ? establishmentDto((appointment as any).establishment) : undefined,
    appointmentType: (appointment as any).appointmentType ? {
      id: hashId.encodeId((appointment as any).appointmentType.id),
      name: (appointment as any).appointmentType.name,
      durationMinutes: (appointment as any).appointmentType.durationMinutes,
      price: (appointment as any).appointmentType.price,
    } : undefined,
  };
};
