import { User, UserRole } from "../../../prisma/interfaces.js";
import prisma from "../../prisma/client.js";
import { UserUpdateInput } from "./user.types.js";

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    return (await prisma.user.findUnique({
      where: { id },
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (await prisma.user.findUnique({
      where: { email },
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User | null;
  }

  async findByLogin(login: string): Promise<User | null> {
    return (await prisma.user.findFirst({
      where: { email: login },
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User | null;
  }

  async findAll(): Promise<User[]> {
    return (await prisma.user.findMany({
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as User[];
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return (await prisma.user.findMany({
      where: { role },
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })) as User[];
  }

  async searchUsers(options: {
    search?: string;
    role?: string;
    establishmentId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; totalCount: number }> {
    const { search, role, establishmentId, page = 1, limit = 10 } = options;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (establishmentId) {
      where.establishmentUsers = {
        some: { establishmentId },
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const totalCount = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users: users as User[], totalCount };
  }

  async findDoctors(options: {
    search?: string;
    establishmentId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ doctors: User[]; totalCount: number }> {
    const { search, establishmentId, page = 1, limit = 10 } = options;

    const where: any = {
      role: UserRole.DOCTOR,
      isActive: true,
    };

    if (establishmentId) {
      where.establishmentUsers = {
        some: { establishmentId },
      };
    }

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const totalCount = await prisma.user.count({ where });
    const doctors = await prisma.user.findMany({
      where,
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
      orderBy: { lastName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { doctors: doctors as User[], totalCount };
  }

  async findPatientsByDoctor(
    doctorId: number,
    options: { search?: string; page?: number; limit?: number }
  ): Promise<{ patients: User[]; totalCount: number }> {
    const { search, page = 1, limit = 10 } = options;

    const where: any = {
      role: UserRole.PATIENT,
      patientAppointments: {
        some: { doctorId },
      },
    };

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
      ];
    }

    const totalCount = await prisma.user.count({ where });
    const patients = await prisma.user.findMany({
      where,
      orderBy: { firstName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { patients: patients as User[], totalCount };
  }

  async update(id: number, data: UserUpdateInput): Promise<User> {
    return (await prisma.user.update({
      where: { id },
      data,
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User;
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async findByForgotPasswordToken(forgotPasswordToken: string): Promise<User | null> {
    return (await prisma.user.findFirst({
      where: { forgotPasswordToken },
      include: {
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User | null;
  }

  async delete(id: number): Promise<User> {
    return (await prisma.user.delete({
      where: { id },
    })) as User;
  }
}
