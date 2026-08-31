import hashId from "../../utils/hashId.js";
import { userDto } from "../user/user.dto.js";
import { appointmentDto } from "../appointment/appointment.dto.js";
import { establishmentDto } from "../establishment/establishment.dto.js";

export function transferDto(transfer: any) {
  if (!transfer) return null;

  return {
    id: hashId.encodeId(transfer.id) || String(transfer.id),
    appointmentId: hashId.encodeId(transfer.appointmentId) || String(transfer.appointmentId),
    patientId: hashId.encodeId(transfer.patientId) || String(transfer.patientId),
    fromEstablishmentId: transfer.fromEstablishmentId ? (hashId.encodeId(transfer.fromEstablishmentId) || String(transfer.fromEstablishmentId)) : undefined,
    toEstablishmentId: transfer.toEstablishmentId ? (hashId.encodeId(transfer.toEstablishmentId) || String(transfer.toEstablishmentId)) : undefined,
    fromDoctorId: hashId.encodeId(transfer.fromDoctorId) || String(transfer.fromDoctorId),
    toDoctorId: hashId.encodeId(transfer.toDoctorId) || String(transfer.toDoctorId),
    reason: transfer.reason,
    status: transfer.status,
    requestedBy: hashId.encodeId(transfer.requestedBy) || String(transfer.requestedBy),
    approvedBy: transfer.approvedBy ? hashId.encodeId(transfer.approvedBy) || String(transfer.approvedBy) : null,
    createdAt: transfer.createdAt,
    updatedAt: transfer.updatedAt,
    appointment: transfer.appointment ? appointmentDto(transfer.appointment) : undefined,
    patient: transfer.patient ? userDto(transfer.patient) : undefined,
    fromDoctor: transfer.fromDoctor ? userDto(transfer.fromDoctor) : undefined,
    toDoctor: transfer.toDoctor ? userDto(transfer.toDoctor) : undefined,
    fromEstablishment: transfer.fromEstablishment ? establishmentDto(transfer.fromEstablishment) : undefined,
    toEstablishment: transfer.toEstablishment ? establishmentDto(transfer.toEstablishment) : undefined,
  };
}
