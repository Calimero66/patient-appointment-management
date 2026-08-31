import { Transfer, TransferStatus } from "../../../prisma/interfaces.js";
import prisma from "../../prisma/client.js";

export class TransferRepository {
  async create(data: {
    appointmentId: number;
    patientId: number;
    fromEstablishmentId: number;
    toEstablishmentId: number;
    fromDoctorId: number;
    toDoctorId: number;
    reason: string;
    requestedBy: number;
  }): Promise<Transfer> {
    return (await prisma.transfer.create({
      data: {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        fromEstablishmentId: data.fromEstablishmentId,
        toEstablishmentId: data.toEstablishmentId,
        fromDoctorId: data.fromDoctorId,
        toDoctorId: data.toDoctorId,
        reason: data.reason,
        status: TransferStatus.REQUESTED,
        requestedBy: data.requestedBy,
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            establishment: true,
            appointmentType: true,
          },
        },
        patient: true,
        fromEstablishment: true,
        toEstablishment: true,
        fromDoctor: true,
        toDoctor: true,
      },
    })) as Transfer;
  }

  async findById(id: number): Promise<Transfer | null> {
    return (await prisma.transfer.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            establishment: true,
            appointmentType: true,
          },
        },
        patient: true,
        fromEstablishment: true,
        toEstablishment: true,
        fromDoctor: true,
        toDoctor: true,
      },
    })) as Transfer | null;
  }

  async findByAppointmentId(appointmentId: number): Promise<Transfer[]> {
    return (await prisma.transfer.findMany({
      where: { appointmentId },
      include: {
        appointment: true,
        patient: true,
        fromEstablishment: true,
        toEstablishment: true,
        fromDoctor: true,
        toDoctor: true,
      },
      orderBy: { createdAt: "desc" },
    })) as Transfer[];
  }

  async findMany(options: {
    patientId?: number;
    doctorId?: number;
    fromDoctorId?: number;
    toDoctorId?: number;
    establishmentId?: number;
    status?: TransferStatus | string;
    page?: number;
    limit?: number;
  }): Promise<{ transfers: Transfer[]; totalCount: number }> {
    const { patientId, doctorId, fromDoctorId, toDoctorId, establishmentId, status, page = 1, limit = 10 } = options;
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.OR = [
        { fromDoctorId: doctorId },
        { toDoctorId: doctorId },
      ];
    } else {
      if (fromDoctorId) where.fromDoctorId = fromDoctorId;
      if (toDoctorId) where.toDoctorId = toDoctorId;
    }

    if (establishmentId) {
      // Show transfers involving this establishment (either source or destination)
      const estFilter = [
        { fromEstablishmentId: establishmentId },
        { toEstablishmentId: establishmentId },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: estFilter }];
        delete where.OR;
      } else {
        where.OR = estFilter;
      }
    }

    if (status) {
      where.status = status;
    }

    const totalCount = await prisma.transfer.count({ where });
    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            establishment: true,
            appointmentType: true,
          },
        },
        patient: true,
        fromEstablishment: true,
        toEstablishment: true,
        fromDoctor: true,
        toDoctor: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { transfers: transfers as Transfer[], totalCount };
  }

  async updateStatus(
    id: number,
    status: TransferStatus | string,
    approvedBy?: number
  ): Promise<Transfer> {
    return (await prisma.transfer.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy ?? null,
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            establishment: true,
            appointmentType: true,
          },
        },
        patient: true,
        fromEstablishment: true,
        toEstablishment: true,
        fromDoctor: true,
        toDoctor: true,
      },
    })) as Transfer;
  }
}
