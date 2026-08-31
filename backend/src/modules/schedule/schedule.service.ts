import { ScheduleRepository } from "./schedule.repository.js";
import { DoctorSchedule, DoctorScheduleException, UserRole } from "../../../prisma/interfaces.js";
import { CreateScheduleExceptionInput, UpdateWeeklyScheduleInput } from "./schedule.schema.js";
import { forbidden, notFound, validationError } from "../../utils/errors.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isActive: false }, // Sunday
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true },  // Monday
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isActive: true },  // Tuesday
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isActive: true },  // Wednesday
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isActive: true },  // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isActive: true },  // Friday
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isActive: false }, // Saturday
];

export class ScheduleService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private auditLogService?: AuditLogService
  ) {}

  /**
   * Get doctor schedule and exceptions for a specific establishment
   */
  async getDoctorSchedule(doctorId: number, establishmentId: number): Promise<{
    schedules: DoctorSchedule[];
    exceptions: DoctorScheduleException[];
  }> {
    let schedules = await this.scheduleRepository.findDoctorSchedules(doctorId, establishmentId);
    
    // If no schedule records exist yet, seed the default 7 days
    if (schedules.length === 0) {
      schedules = await this.scheduleRepository.upsertWeeklySchedules(doctorId, establishmentId, DEFAULT_SCHEDULE);
    }

    const exceptions = await this.scheduleRepository.findDoctorExceptions(doctorId, establishmentId);
    return { schedules, exceptions };
  }

  /**
   * Update weekly schedule for doctor at a specific establishment
   */
  async updateWeeklySchedule(
    doctorId: number,
    establishmentId: number,
    data: UpdateWeeklyScheduleInput
  ): Promise<DoctorSchedule[]> {
    for (const item of data.schedules) {
      if (item.isActive && item.startTime >= item.endTime) {
        throw validationError(`Day ${item.dayOfWeek}: Start time must be before end time`);
      }
    }

    const updated = await this.scheduleRepository.upsertWeeklySchedules(doctorId, establishmentId, data.schedules);

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: doctorId,
        action: "UPDATE_WEEKLY_SCHEDULE",
        entity: "DoctorSchedule",
        entityId: doctorId,
        newValue: JSON.stringify({ establishmentId, schedules: data.schedules }),
      });
    }

    return updated;
  }

  /**
   * Add a schedule exception / time-off (vacation, leave, date range, etc.)
   */
  async createException(
    doctorId: number,
    establishmentId: number,
    data: CreateScheduleExceptionInput
  ): Promise<{
    exceptions: DoctorScheduleException[];
    totalDays: number;
    conflictingAppointments: any[];
  }> {
    const dates: Date[] = [];

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw validationError("Invalid date range format");
      }

      if (start > end) {
        throw validationError("startDate must be before or equal to endDate");
      }

      // Check max range (e.g. 90 days)
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 90) {
        throw validationError("Time-off date range cannot exceed 90 days in a single request");
      }

      const curr = new Date(start);
      while (curr <= end) {
        dates.push(new Date(curr.toISOString().split("T")[0] + "T00:00:00.000Z"));
        curr.setDate(curr.getDate() + 1);
      }
    } else if (data.exceptionDate) {
      const d = new Date(data.exceptionDate);
      if (isNaN(d.getTime())) {
        throw validationError("Invalid exception date format");
      }
      dates.push(new Date(d.toISOString().split("T")[0] + "T00:00:00.000Z"));
    } else {
      throw validationError("Please provide exceptionDate or startDate & endDate");
    }

    // 1. Detect any conflicting appointments booked on these dates
    const conflictingAppointments = await this.scheduleRepository.findConflictingAppointments(
      doctorId,
      establishmentId,
      dates
    );

    // 2. Create or update time-off exceptions for each date
    const createdExceptions: DoctorScheduleException[] = [];
    for (const d of dates) {
      const item = await this.scheduleRepository.createException({
        doctorId,
        establishmentId,
        exceptionDate: d,
        type: data.type,
        reason: data.reason ?? null,
      });
      createdExceptions.push(item);
    }

    // 3. Audit log
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: doctorId,
        action: "CREATE_SCHEDULE_EXCEPTION",
        entity: "DoctorScheduleException",
        entityId: createdExceptions[0]?.id ?? 0,
        newValue: {
          totalDays: createdExceptions.length,
          type: data.type,
          reason: data.reason,
          establishmentId,
          conflictsCount: conflictingAppointments.length,
          startDate: dates[0]?.toISOString().split("T")[0],
          endDate: dates[dates.length - 1]?.toISOString().split("T")[0],
        },
      });
    }

    return {
      exceptions: createdExceptions,
      totalDays: createdExceptions.length,
      conflictingAppointments,
    };
  }

  /**
   * Delete schedule exception
   */
  async deleteException(
    requestingUserId: number,
    requestingUserRole: UserRole,
    exceptionId: number
  ): Promise<DoctorScheduleException> {
    const exception = await this.scheduleRepository.findExceptionById(exceptionId);
    if (!exception) {
      throw notFound("Schedule exception not found");
    }

    if (
      requestingUserRole !== UserRole.SUPER_ADMIN &&
      exception.doctorId !== requestingUserId
    ) {
      throw forbidden("Access denied to this schedule exception");
    }

    const deleted = await this.scheduleRepository.deleteException(exceptionId);

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: "DELETE_SCHEDULE_EXCEPTION",
        entity: "DoctorScheduleException",
        entityId: exceptionId,
        oldValue: {
          exceptionDate: exception.exceptionDate,
          type: exception.type,
        },
      });
    }

    return deleted;
  }
}
