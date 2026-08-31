import { Appointment, AppointmentStatus } from "../../../prisma/interfaces.js";
import prisma from "../../prisma/client.js";

export class AppointmentRepository {
  async create(data: {
    patientId: number;
    doctorId: number;
    establishmentId: number;
    appointmentTypeId: number;
    appointmentDate: Date;
    startTime: Date;
    endTime: Date;
    status?: AppointmentStatus;
    reason?: string | null;
    notes?: string | null;
    createdBy: number;
  }): Promise<Appointment> {
    return (await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        establishmentId: data.establishmentId,
        appointmentTypeId: data.appointmentTypeId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status ?? AppointmentStatus.PENDING,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
      },
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
    })) as Appointment;
  }

  async findById(id: number): Promise<Appointment | null> {
    return (await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
    })) as Appointment | null;
  }

  async findMany(options: {
    patientId?: number;
    doctorId?: number;
    establishmentId?: number;
    status?: AppointmentStatus;
    date?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: Appointment[]; totalCount: number }> {
    const { patientId, doctorId, establishmentId, status, date, page = 1, limit = 10 } = options;

    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (establishmentId) {
      where.establishmentId = establishmentId;
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const totalCount = await prisma.appointment.count({ where });
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
      orderBy: [
        { appointmentDate: "asc" },
        { startTime: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return { appointments: appointments as Appointment[], totalCount };
  }

  async checkDoctorConflict(
    doctorId: number,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: number
  ): Promise<boolean> {
    const where: any = {
      doctorId,
      status: {
        notIn: [AppointmentStatus.CANCELLED],
      },
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflictingCount = await prisma.appointment.count({ where });
    return conflictingCount > 0;
  }

  async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
    return (await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
    })) as Appointment;
  }

  async updateStatus(id: number, status: AppointmentStatus, notes?: string): Promise<Appointment> {
    const data: any = { status };
    if (notes) {
      data.notes = notes;
    }
    return (await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
    })) as Appointment;
  }

  async delete(id: number): Promise<Appointment> {
    return (await prisma.appointment.delete({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        establishment: true,
        appointmentType: true,
      },
    })) as Appointment;
  }
}
