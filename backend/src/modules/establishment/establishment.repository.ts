import prisma from '../../prisma/client.js';
import { Establishment, EstablishmentUser } from '../../../prisma/interfaces.js';

export class EstablishmentRepository {
  async create(data: { name: string; type?: string; address: string; city?: string; phone?: string; email?: string }): Promise<Establishment> {
    return prisma.establishment.create({
      data,
    }) as Promise<Establishment>;
  }

  async findById(id: number): Promise<Establishment | null> {
    return prisma.establishment.findUnique({
      where: { id },
    }) as Promise<Establishment | null>;
  }

  async findAll(): Promise<Establishment[]> {
    return prisma.establishment.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<Establishment[]>;
  }

  async search(options: { search?: string; page?: number; limit?: number }): Promise<{ establishments: Establishment[]; totalCount: number }> {
    const { search, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { city: { contains: search } }
      ]
    } : {};

    const [establishments, totalCount] = await Promise.all([
      prisma.establishment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.establishment.count({ where }),
    ]);

    return { establishments: establishments as Establishment[], totalCount };
  }

  async update(id: number, data: Partial<Establishment>): Promise<Establishment> {
    return prisma.establishment.update({
      where: { id },
      data,
    }) as Promise<Establishment>;
  }

  async delete(id: number): Promise<Establishment> {
    return prisma.establishment.delete({
      where: { id },
    }) as Promise<Establishment>;
  }

  async addUser(data: { establishmentId: number; userId: number; role: string }): Promise<EstablishmentUser> {
    return prisma.establishmentUser.create({
      data,
      include: { user: true },
    }) as unknown as Promise<EstablishmentUser>;
  }

  async removeUser(establishmentId: number, userId: number): Promise<EstablishmentUser> {
    return prisma.establishmentUser.delete({
      where: {
        establishmentId_userId: {
          establishmentId,
          userId,
        },
      },
    }) as unknown as Promise<EstablishmentUser>;
  }

  async findUsersByEstablishment(establishmentId: number): Promise<EstablishmentUser[]> {
    return prisma.establishmentUser.findMany({
      where: { establishmentId },
      include: { user: true },
    }) as unknown as Promise<EstablishmentUser[]>;
  }

  async findEstablishmentsByUser(userId: number): Promise<EstablishmentUser[]> {
    return prisma.establishmentUser.findMany({
      where: { userId },
      include: { establishment: true },
    }) as unknown as Promise<EstablishmentUser[]>;
  }

  async findEstablishmentUser(establishmentId: number, userId: number): Promise<EstablishmentUser | null> {
    return prisma.establishmentUser.findUnique({
      where: {
        establishmentId_userId: {
          establishmentId,
          userId,
        },
      },
    }) as unknown as Promise<EstablishmentUser | null>;
  }
}
