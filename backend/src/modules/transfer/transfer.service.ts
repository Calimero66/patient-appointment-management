import { TransferRepository } from "./transfer.repository.js";
import { AppointmentRepository } from "../appointment/appointment.repository.js";
import { Transfer, TransferStatus, UserRole, AppointmentStatus } from "../../../prisma/interfaces.js";
import { CreateTransferInput } from "./transfer.schema.js";
import { conflict, forbidden, notFound, validationError } from "../../utils/errors.js";
import prisma from "../../prisma/client.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";
import { NotificationService } from "../notification/notification.service.js";

export class TransferService {
  constructor(
    private transferRepository: TransferRepository,
    private appointmentRepository: AppointmentRepository,
    private auditLogService?: AuditLogService,
    private notificationService?: NotificationService
  ) {}

  /**
   * Request a transfer of an appointment to another doctor
   */
  async requestTransfer(
    requestingUserId: number,
    requestingUserRole: UserRole,
    data: CreateTransferInput
  ): Promise<Transfer> {
    // 1. Fetch and validate appointment
    const appointment = await this.appointmentRepository.findById(data.appointmentId);
    if (!appointment) {
      throw notFound("Appointment not found");
    }

    // 2. Permission check: the doctor, the patient, or Super Admin can initiate transfer
    if (
      requestingUserRole !== UserRole.SUPER_ADMIN &&
      appointment.doctorId !== requestingUserId &&
      appointment.patientId !== requestingUserId
    ) {
      throw forbidden("You can only request transfers for your own appointments");
    }

    // Cannot transfer cancelled or completed appointments
    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
      throw validationError(`Cannot transfer an appointment that is already ${appointment.status.toLowerCase()}`);
    }

    // 3. Validate target doctor
    if (data.toDoctorId === appointment.doctorId) {
      throw validationError("Target doctor cannot be the same as current doctor");
    }

    const targetDoctor = await prisma.user.findUnique({
      where: { id: data.toDoctorId },
    });
    if (!targetDoctor || targetDoctor.role !== UserRole.DOCTOR || !targetDoctor.isActive) {
      throw notFound("Target doctor not found or is inactive");
    }

    // 4. Check for target doctor schedule conflict
    const hasConflict = await this.appointmentRepository.checkDoctorConflict(
      data.toDoctorId,
      appointment.startTime,
      appointment.endTime
    );
    if (hasConflict) {
      throw conflict("The target doctor already has an appointment booked in this time slot");
    }

    // 5. Determine target establishment
    let targetEstablishmentId = data.toEstablishmentId;
    if (!targetEstablishmentId) {
      const docEst = await prisma.establishmentUser.findFirst({
        where: { userId: data.toDoctorId, role: "DOCTOR" },
      });
      targetEstablishmentId = docEst?.establishmentId ?? appointment.establishmentId;
    }

    // 6. Create transfer request
    const transfer = await this.transferRepository.create({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      fromEstablishmentId: appointment.establishmentId,
      toEstablishmentId: targetEstablishmentId,
      fromDoctorId: appointment.doctorId,
      toDoctorId: data.toDoctorId,
      reason: data.reason,
      requestedBy: requestingUserId,
    });

    // 7. Audit log
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: "TRANSFER_REQUESTED",
        entity: "Transfer",
        entityId: transfer.id,
        newValue: {
          appointmentId: appointment.id,
          fromEstablishmentId: appointment.establishmentId,
          toEstablishmentId: targetEstablishmentId,
          fromDoctorId: appointment.doctorId,
          toDoctorId: data.toDoctorId,
          reason: data.reason,
        },
      });
    }

    // 7. Notification dispatch for transfer request
    if (this.notificationService) {
      try {
        const fromDoctor = await prisma.user.findUnique({ where: { id: appointment.doctorId } });
        const patient = await prisma.user.findUnique({ where: { id: appointment.patientId } });
        const dateStr = appointment.appointmentDate instanceof Date
          ? appointment.appointmentDate.toISOString().split('T')[0]
          : String(appointment.appointmentDate).split('T')[0];

        // Notify the TARGET doctor that they have an incoming transfer request
        await this.notificationService.createNotification(
          data.toDoctorId,
          "Incoming Transfer Request",
          `A transfer request has been submitted for an appointment on ${dateStr} from Dr. ${fromDoctor?.lastName || 'Unknown'}.${data.reason ? ` Reason: ${data.reason}` : ''}`,
          "TRANSFER"
        );

        // Notify the CURRENT doctor (fromDoctor) that a transfer was requested for their appointment
        if (appointment.doctorId !== requestingUserId) {
          await this.notificationService.createNotification(
            appointment.doctorId,
            "Transfer Requested",
            `A transfer has been requested for your appointment on ${dateStr} with patient ${patient?.firstName || ''} ${patient?.lastName || ''}.`,
            "TRANSFER"
          );
        }

        // Notify the PATIENT if they didn't initiate the transfer
        if (appointment.patientId !== requestingUserId) {
          await this.notificationService.createNotification(
            appointment.patientId,
            "Transfer Requested",
            `A transfer request has been submitted for your appointment on ${dateStr} to a new doctor.`,
            "TRANSFER"
          );
        }
      } catch (err) {
        console.error("Failed to send transfer request notifications:", err);
      }
    }

    return transfer;
  }

  /**
   * Get transfers for logged in user (Doctors see incoming/outgoing, Patients see own, Super Admin sees all)
   */
  async getTransfers(
    requestingUserId: number,
    requestingUserRole: UserRole,
    query: {
      fromDoctorId?: number;
      toDoctorId?: number;
      status?: TransferStatus | string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ transfers: Transfer[]; totalCount: number }> {
    const filters: any = {
      status: query.status,
      page: query.page,
      limit: query.limit,
    };

    if (requestingUserRole === UserRole.DOCTOR) {
      filters.doctorId = requestingUserId;
    } else if (requestingUserRole === UserRole.PATIENT) {
      filters.patientId = requestingUserId;
    } else if (requestingUserRole === UserRole.SUPER_ADMIN) {
      if (query.fromDoctorId) filters.fromDoctorId = query.fromDoctorId;
      if (query.toDoctorId) filters.toDoctorId = query.toDoctorId;
    } else {
      throw forbidden("Access denied to transfers");
    }

    return await this.transferRepository.findMany(filters);
  }

  /**
   * Respond to transfer request (Accept / Reject / Cancel)
   */
  async respondToTransfer(
    requestingUserId: number,
    requestingUserRole: UserRole,
    transferId: number,
    newStatus: "APPROVED" | "REJECTED" | "CANCELLED"
  ): Promise<Transfer> {
    const transfer = await this.transferRepository.findById(transferId);
    if (!transfer) {
      throw notFound("Transfer request not found");
    }

    if (transfer.status !== TransferStatus.REQUESTED) {
      throw conflict(`This transfer request has already been ${transfer.status.toLowerCase()}`);
    }

    // Role and ownership rules:
    if (newStatus === "APPROVED" || newStatus === "REJECTED") {
      // Only the receiving doctor (toDoctor) or Super Admin can accept/reject
      if (
        requestingUserRole !== UserRole.SUPER_ADMIN &&
        transfer.toDoctorId !== requestingUserId
      ) {
        throw forbidden("Only the receiving doctor can accept or reject this transfer request");
      }
    } else if (newStatus === "CANCELLED") {
      // Only the requesting doctor (fromDoctor) or Super Admin can cancel
      if (
        requestingUserRole !== UserRole.SUPER_ADMIN &&
        transfer.fromDoctorId !== requestingUserId
      ) {
        throw forbidden("Only the originating doctor can cancel this transfer request");
      }
    }

    // If APPROVED: transfer the appointment to the new doctor and confirm it
    if (newStatus === "APPROVED") {
      const appointment = await this.appointmentRepository.findById(transfer.appointmentId);
      if (!appointment) {
        throw notFound("Associated appointment not found");
      }

      // Check conflict for the new doctor once more
      const hasConflict = await this.appointmentRepository.checkDoctorConflict(
        transfer.toDoctorId,
        appointment.startTime,
        appointment.endTime,
        appointment.id
      );
      if (hasConflict) {
        throw conflict("Cannot accept transfer: You now have a conflicting appointment at this time");
      }

      // Update appointment doctorId and establishmentId to target doctor and establishment, and status to CONFIRMED
      await this.appointmentRepository.update(transfer.appointmentId, {
        doctorId: transfer.toDoctorId,
        establishmentId: transfer.toEstablishmentId || appointment.establishmentId,
        status: AppointmentStatus.CONFIRMED,
      });
    }

    const updatedTransfer = await this.transferRepository.updateStatus(
      transferId,
      newStatus as TransferStatus,
      requestingUserId
    );

    // Audit log
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: `TRANSFER_${newStatus}`,
        entity: "Transfer",
        entityId: transferId,
        oldValue: { status: transfer.status },
        newValue: { status: updatedTransfer.status, approvedBy: requestingUserId },
      });
    }

    // Notification dispatch for transfer response
    if (this.notificationService) {
      try {
        const fromDoctor = await prisma.user.findUnique({ where: { id: transfer.fromDoctorId } });
        const toDoctor = await prisma.user.findUnique({ where: { id: transfer.toDoctorId } });
        const appointment = await this.appointmentRepository.findById(transfer.appointmentId);
        const dateStr = appointment?.appointmentDate instanceof Date
          ? appointment.appointmentDate.toISOString().split('T')[0]
          : appointment ? String(appointment.appointmentDate).split('T')[0] : 'N/A';

        if (newStatus === "APPROVED") {
          // Notify PATIENT that their appointment was transferred
          await this.notificationService.createNotification(
            transfer.patientId,
            "Transfer Approved",
            `Your appointment on ${dateStr} has been transferred from Dr. ${fromDoctor?.lastName || 'Unknown'} to Dr. ${toDoctor?.lastName || 'Unknown'}.`,
            "TRANSFER"
          );
          // Notify FROM DOCTOR that transfer was accepted
          await this.notificationService.createNotification(
            transfer.fromDoctorId,
            "Transfer Approved",
            `Dr. ${toDoctor?.lastName || 'Unknown'} has accepted the transfer for the appointment on ${dateStr}.`,
            "TRANSFER"
          );
          // Notify TO DOCTOR confirmation
          if (transfer.toDoctorId !== requestingUserId) {
            await this.notificationService.createNotification(
              transfer.toDoctorId,
              "Transfer Confirmed",
              `You have accepted the transfer for the appointment on ${dateStr}. The appointment is now confirmed.`,
              "TRANSFER"
            );
          }
        } else if (newStatus === "REJECTED") {
          // Notify PATIENT that transfer was rejected
          await this.notificationService.createNotification(
            transfer.patientId,
            "Transfer Rejected",
            `The transfer request for your appointment on ${dateStr} was rejected by Dr. ${toDoctor?.lastName || 'Unknown'}.`,
            "TRANSFER"
          );
          // Notify FROM DOCTOR that transfer was rejected
          await this.notificationService.createNotification(
            transfer.fromDoctorId,
            "Transfer Rejected",
            `Dr. ${toDoctor?.lastName || 'Unknown'} has rejected the transfer request for the appointment on ${dateStr}.`,
            "TRANSFER"
          );
        } else if (newStatus === "CANCELLED") {
          // Notify PATIENT that transfer was cancelled
          await this.notificationService.createNotification(
            transfer.patientId,
            "Transfer Cancelled",
            `The transfer request for your appointment on ${dateStr} has been cancelled.`,
            "TRANSFER"
          );
          // Notify TO DOCTOR that transfer was cancelled
          await this.notificationService.createNotification(
            transfer.toDoctorId,
            "Transfer Cancelled",
            `The transfer request for the appointment on ${dateStr} from Dr. ${fromDoctor?.lastName || 'Unknown'} has been cancelled.`,
            "TRANSFER"
          );
        }
      } catch (err) {
        console.error("Failed to send transfer response notifications:", err);
      }
    }

    return updatedTransfer;
  }
}
