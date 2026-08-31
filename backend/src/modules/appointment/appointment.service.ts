import { AppointmentRepository } from "./appointment.repository.js";
import { Appointment, AppointmentStatus, UserRole } from "../../../prisma/interfaces.js";
import { CreateAppointmentInput, FilterAppointmentQueryInput, UpdateAppointmentInput } from "./appointment.schema.js";
import { conflict, forbidden, notFound, validationError } from "../../utils/errors.js";
import prisma from "../../prisma/client.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";
import { NotificationService } from "../notification/notification.service.js";

function parseDateTimeHelper(dateStr: string, timeStr: string): Date {
  const timeTrimmed = timeStr.trim();
  if (timeTrimmed.includes("T")) {
    const d = new Date(timeTrimmed);
    if (!isNaN(d.getTime())) return d;
  }

  const dateOnly = dateStr.split("T")[0];
  const parts = timeTrimmed.split(":");
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    const ss = parts[2] ? parts[2].padStart(2, "0") : "00";
    return new Date(`${dateOnly}T${hh}:${mm}:${ss}.000Z`);
  }

  return new Date(timeTrimmed);
}

export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private auditLogService?: AuditLogService,
    private notificationService?: NotificationService
  ) {}

  async createAppointment(
    creatorId: number,
    creatorRole: UserRole,
    data: CreateAppointmentInput
  ): Promise<Appointment> {
    // 1. Automatic Patient ID Resolution:
    // If patientId is omitted, automatically default to the currently logged-in user (creatorId)
    const targetPatientId = data.patientId ?? creatorId;

    // 2. Validate Patient user exists
    const patient = await prisma.user.findUnique({ where: { id: targetPatientId } });
    if (!patient) {
      throw notFound("Patient user not found");
    }

    // 3. Validate Doctor user exists and is DOCTOR
    const doctor = await prisma.user.findUnique({ where: { id: data.doctorId } });
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw notFound("Doctor user not found");
    }

    // 4. Resolve AppointmentType — use provided ID or fall back to first active type
    let resolvedTypeId = data.appointmentTypeId;
    if (!resolvedTypeId) {
      const defaultType = await prisma.appointmentType.findFirst({ where: { isActive: true } });
      if (!defaultType) {
        throw notFound("No appointment types are configured. Please contact an administrator.");
      }
      resolvedTypeId = defaultType.id;
    }
    const appType = await prisma.appointmentType.findUnique({ where: { id: resolvedTypeId } });
    if (!appType) {
      throw notFound("Appointment Type not found");
    }

    const appDate = new Date(data.appointmentDate);
    const startDate = parseDateTimeHelper(data.appointmentDate, data.startTime);
    const endDate = parseDateTimeHelper(data.appointmentDate, data.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw validationError("Invalid start or end time format");
    }

    if (startDate >= endDate) {
      throw validationError("Start time must be before end time");
    }

    // 5. Check Doctor Time-Off / Schedule Exceptions (Vacation, Absence, Leave)
    const doctorTimeOff = await prisma.doctorScheduleException.findFirst({
      where: {
        doctorId: data.doctorId,
        exceptionDate: appDate,
      },
    });
    if (doctorTimeOff) {
      const typeLabel = doctorTimeOff.type.toLowerCase().replace(/_/g, " ");
      throw conflict(
        `Doctor is unavailable on this date (${typeLabel}${doctorTimeOff.reason ? `: ${doctorTimeOff.reason}` : ""})`
      );
    }

    // 6. Check Doctor Schedule Conflicts (overlapping appointments)
    const hasConflict = await this.appointmentRepository.checkDoctorConflict(
      data.doctorId,
      startDate,
      endDate
    );
    if (hasConflict) {
      throw conflict("Doctor already has an appointment booked for this time slot");
    }

    // 6. Resolve Establishment ID
    let resolvedEstId = data.establishmentId;
    if (!resolvedEstId) {
      const docEstablishment = await prisma.establishmentUser.findFirst({
        where: { userId: data.doctorId },
      });
      if (docEstablishment) {
        resolvedEstId = docEstablishment.establishmentId;
      } else {
        const defaultEst = await prisma.establishment.findFirst({ where: { isActive: true } });
        if (!defaultEst) {
          throw notFound("No active establishment configured in the system.");
        }
        resolvedEstId = defaultEst.id;
      }
    } else {
      const est = await prisma.establishment.findUnique({ where: { id: resolvedEstId } });
      if (!est) {
        throw notFound("Establishment not found");
      }
    }

    // 7. Create Appointment
    const appointment = await this.appointmentRepository.create({
      patientId: targetPatientId,
      doctorId: data.doctorId,
      establishmentId: resolvedEstId,
      appointmentTypeId: resolvedTypeId,
      appointmentDate: appDate,
      startTime: startDate,
      endTime: endDate,
      status: AppointmentStatus.PENDING,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
      createdBy: creatorId,
    });

    // 8. Audit Log
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: creatorId,
        action: "CREATE",
        entity: "Appointment",
        entityId: appointment.id,
        newValue: {
          patientId: targetPatientId,
          doctorId: data.doctorId,
          establishmentId: resolvedEstId,
          appointmentTypeId: resolvedTypeId,
          appointmentDate: data.appointmentDate,
          status: appointment.status,
        },
      });
    }

    // 7. Automated Notification Dispatch
    if (this.notificationService) {
      try {
        await this.notificationService.createNotification(
          targetPatientId,
          "Appointment Scheduled",
          `Your appointment with Dr. ${doctor.lastName} on ${data.appointmentDate} at ${data.startTime} is pending confirmation.`,
          "APPOINTMENT"
        );
        await this.notificationService.createNotification(
          data.doctorId,
          "New Appointment Request",
          `Patient ${patient.firstName} ${patient.lastName} has booked an appointment for ${data.appointmentDate} at ${data.startTime}.`,
          "APPOINTMENT"
        );
      } catch (err) {
        console.error("Failed to send appointment notification:", err);
      }
    }

    return appointment;
  }

  async getAppointments(
    requestingUserId: number,
    requestingUserRole: UserRole,
    query: FilterAppointmentQueryInput
  ): Promise<{ appointments: Appointment[]; totalCount: number }> {
    const filters: any = {
      establishmentId: query.establishmentId,
      status: query.status,
      date: query.date ? new Date(query.date) : undefined,
      page: query.page,
      limit: query.limit,
    };

    // Role-based Access Rules:
    if (requestingUserRole === UserRole.PATIENT) {
      filters.patientId = requestingUserId;
    } else if (requestingUserRole === UserRole.DOCTOR) {
      filters.doctorId = requestingUserId;
      if (query.patientId) filters.patientId = query.patientId;
    } else if (requestingUserRole === UserRole.ESTABLISHMENT_ADMIN) {
      if (!filters.establishmentId) {
        const adminEst = await prisma.establishmentUser.findFirst({
          where: { userId: requestingUserId, role: "ADMIN" },
        });
        if (adminEst) {
          filters.establishmentId = adminEst.establishmentId;
        }
      }
      if (query.patientId) filters.patientId = query.patientId;
      if (query.doctorId) filters.doctorId = query.doctorId;
    } else if (requestingUserRole === UserRole.SUPER_ADMIN) {
      if (query.patientId) filters.patientId = query.patientId;
      if (query.doctorId) filters.doctorId = query.doctorId;
    }

    return await this.appointmentRepository.findMany(filters);
  }

  async getAppointmentById(
    requestingUserId: number,
    requestingUserRole: UserRole,
    id: number
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) throw notFound("Appointment");

    // Ownership check
    if (
      requestingUserRole !== UserRole.SUPER_ADMIN &&
      appointment.patientId !== requestingUserId &&
      appointment.doctorId !== requestingUserId
    ) {
      throw forbidden("Access denied to this appointment");
    }

    return appointment;
  }

  async updateAppointment(
    requestingUserId: number,
    requestingUserRole: UserRole,
    id: number,
    data: UpdateAppointmentInput
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(requestingUserId, requestingUserRole, id);

    const updateData: Partial<Appointment> = {};
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const baseDateStr = data.appointmentDate ?? appointment.appointmentDate.toISOString().split("T")[0];

    if (data.appointmentDate) updateData.appointmentDate = new Date(data.appointmentDate);
    if (data.startTime) updateData.startTime = parseDateTimeHelper(baseDateStr, data.startTime);
    if (data.endTime) updateData.endTime = parseDateTimeHelper(baseDateStr, data.endTime);

    const newStart = updateData.startTime ?? appointment.startTime;
    const newEnd = updateData.endTime ?? appointment.endTime;

    if (data.startTime || data.endTime) {
      if (newStart >= newEnd) {
        throw validationError("Start time must be before end time");
      }
      const hasConflict = await this.appointmentRepository.checkDoctorConflict(
        appointment.doctorId,
        newStart,
        newEnd,
        id
      );
      if (hasConflict) {
        throw conflict("Doctor already has an appointment booked for this time slot");
      }
    }

    const updated = await this.appointmentRepository.update(id, updateData);

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: "UPDATE",
        entity: "Appointment",
        entityId: id,
        oldValue: { startTime: appointment.startTime, endTime: appointment.endTime, status: appointment.status },
        newValue: { startTime: updated.startTime, endTime: updated.endTime, status: updated.status },
      });
    }

    return updated;
  }

  async updateStatus(
    requestingUserId: number,
    requestingUserRole: UserRole,
    id: number,
    status: AppointmentStatus,
    notes?: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(requestingUserId, requestingUserRole, id);

    // Only Doctor or Super Admin can update status to CONFIRMED, COMPLETED, NO_SHOW
    if (
      requestingUserRole === UserRole.PATIENT &&
      status !== AppointmentStatus.CANCELLED
    ) {
      throw forbidden("Patients can only cancel appointments");
    }

    const updated = await this.appointmentRepository.updateStatus(id, status, notes);

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: "UPDATE_STATUS",
        entity: "Appointment",
        entityId: id,
        oldValue: { status: appointment.status },
        newValue: { status: updated.status, notes: updated.notes },
      });
    }

    // Automated Status Notification Dispatch
    if (this.notificationService) {
      try {
        const doctor = await prisma.user.findUnique({ where: { id: appointment.doctorId } });
        const patient = await prisma.user.findUnique({ where: { id: appointment.patientId } });
        const dateStr = appointment.appointmentDate instanceof Date
          ? appointment.appointmentDate.toISOString().split('T')[0]
          : String(appointment.appointmentDate).split('T')[0];
        const doctorName = `Dr. ${doctor?.lastName || 'Unknown'}`;
        const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown';

        if (status === AppointmentStatus.CONFIRMED) {
          // Notify PATIENT that their appointment is confirmed
          await this.notificationService.createNotification(
            appointment.patientId,
            "Appointment Confirmed",
            `Your appointment with ${doctorName} on ${dateStr} has been confirmed.`,
            "CONFIRMATION"
          );
          // Notify DOCTOR confirmation acknowledgment
          if (appointment.doctorId !== requestingUserId) {
            await this.notificationService.createNotification(
              appointment.doctorId,
              "Appointment Confirmed",
              `Your appointment with patient ${patientName} on ${dateStr} has been confirmed.`,
              "CONFIRMATION"
            );
          }
        } else if (status === AppointmentStatus.COMPLETED) {
          // Notify PATIENT that their consultation is complete
          await this.notificationService.createNotification(
            appointment.patientId,
            "Consultation Completed",
            `Your consultation with ${doctorName} on ${dateStr} has been completed.${notes ? ' Check your portal for doctor notes.' : ''}`,
            "COMPLETION"
          );
          // Notify DOCTOR completion acknowledgment
          if (appointment.doctorId !== requestingUserId) {
            await this.notificationService.createNotification(
              appointment.doctorId,
              "Consultation Completed",
              `Your consultation with patient ${patientName} on ${dateStr} has been marked as completed.`,
              "COMPLETION"
            );
          }
        } else if (status === AppointmentStatus.CANCELLED) {
          // Notify PATIENT
          await this.notificationService.createNotification(
            appointment.patientId,
            "Appointment Cancelled",
            `Your appointment with ${doctorName} on ${dateStr} was cancelled.`,
            "CANCELLATION"
          );
          // Notify DOCTOR
          await this.notificationService.createNotification(
            appointment.doctorId,
            "Appointment Cancelled",
            `The appointment with patient ${patientName} on ${dateStr} has been cancelled.`,
            "CANCELLATION"
          );
        }
      } catch (err) {
        console.error("Failed to send status notification:", err);
      }
    }

    return updated;
  }

  async cancelAppointment(
    requestingUserId: number,
    requestingUserRole: UserRole,
    id: number
  ): Promise<Appointment> {
    return await this.updateStatus(
      requestingUserId,
      requestingUserRole,
      id,
      AppointmentStatus.CANCELLED,
      "Cancelled by user"
    );
  }
}
