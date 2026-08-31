import { DoctorSchedule, DoctorScheduleException } from "../../../prisma/interfaces.js";
import prisma from "../../prisma/client.js";

function timeStringToDate(timeStr: string): Date {
  const parts = timeStr.trim().split(":");
  const hh = parts[0]?.padStart(2, "0") || "09";
  const mm = parts[1]?.padStart(2, "0") || "00";
  return new Date(`1970-01-01T${hh}:${mm}:00.000Z`);
}

export class ScheduleRepository {
  async findDoctorSchedules(doctorId: number, establishmentId: number): Promise<DoctorSchedule[]> {
    return (await prisma.doctorSchedule.findMany({
      where: { doctorId, establishmentId },
      orderBy: { dayOfWeek: "asc" },
    })) as DoctorSchedule[];
  }

  async findDoctorExceptions(doctorId: number, establishmentId: number): Promise<DoctorScheduleException[]> {
    return (await prisma.doctorScheduleException.findMany({
      where: { doctorId, establishmentId },
      orderBy: { exceptionDate: "asc" },
    })) as DoctorScheduleException[];
  }

  async upsertWeeklySchedules(
    doctorId: number,
    establishmentId: number,
    schedules: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>
  ): Promise<DoctorSchedule[]> {
    const results: DoctorSchedule[] = [];

    for (const item of schedules) {
      const startDateTime = timeStringToDate(item.startTime);
      const endDateTime = timeStringToDate(item.endTime);

      const existing = await prisma.doctorSchedule.findFirst({
        where: { doctorId, establishmentId, dayOfWeek: item.dayOfWeek },
      });

      if (existing) {
        const updated = await prisma.doctorSchedule.update({
          where: { id: existing.id },
          data: {
            startTime: startDateTime,
            endTime: endDateTime,
            isActive: item.isActive,
          },
        });
        results.push(updated as DoctorSchedule);
      } else {
        const created = await prisma.doctorSchedule.create({
          data: {
            doctorId,
            establishmentId,
            dayOfWeek: item.dayOfWeek,
            startTime: startDateTime,
            endTime: endDateTime,
            isActive: item.isActive,
          },
        });
        results.push(created as DoctorSchedule);
      }
    }

    return results;
  }

  async findExistingExceptionForDate(
    doctorId: number,
    establishmentId: number,
    exceptionDate: Date
  ): Promise<DoctorScheduleException | null> {
    return (await prisma.doctorScheduleException.findFirst({
      where: {
        doctorId,
        establishmentId,
        exceptionDate,
      },
    })) as DoctorScheduleException | null;
  }

  async findConflictingAppointments(
    doctorId: number,
    establishmentId: number,
    dates: Date[]
  ): Promise<any[]> {
    if (dates.length === 0) return [];

    return await prisma.appointment.findMany({
      where: {
        doctorId,
        establishmentId,
        appointmentDate: { in: dates },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    });
  }

  async createException(data: {
    doctorId: number;
    establishmentId: number;
    exceptionDate: Date;
    type: string;
    reason?: string | null;
  }): Promise<DoctorScheduleException> {
    // If exception already exists for this date, update it
    const existing = await this.findExistingExceptionForDate(data.doctorId, data.establishmentId, data.exceptionDate);
    if (existing) {
      return (await prisma.doctorScheduleException.update({
        where: { id: existing.id },
        data: {
          type: data.type,
          reason: data.reason ?? null,
        },
      })) as DoctorScheduleException;
    }

    return (await prisma.doctorScheduleException.create({
      data: {
        doctorId: data.doctorId,
        establishmentId: data.establishmentId,
        exceptionDate: data.exceptionDate,
        type: data.type,
        reason: data.reason ?? null,
      },
    })) as DoctorScheduleException;
  }

  async findExceptionById(id: number): Promise<DoctorScheduleException | null> {
    return (await prisma.doctorScheduleException.findUnique({
      where: { id },
    })) as DoctorScheduleException | null;
  }

  async deleteException(id: number): Promise<DoctorScheduleException> {
    return (await prisma.doctorScheduleException.delete({
      where: { id },
    })) as DoctorScheduleException;
  }
}
