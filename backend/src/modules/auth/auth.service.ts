import bcrypt from "bcryptjs";
import { signToken } from "../../utils/jwt.js";
import { conflict, unauthorized } from "../../utils/errors.js";
import prisma from "../../prisma/client.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";
import { User, UserRole } from "../../../prisma/interfaces.js";

export class AuthService {
  /**
   * Public Register - Always forces PATIENT role.
   * Doctors, Admins, and Super Admins must be created via the protected /api/users/create endpoint.
   */
  async register(data: RegisterInput): Promise<User> {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw conflict("Email");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        role: UserRole.PATIENT, // Forced: Public register is ONLY for Patients
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender ?? null,
        address: data.address ?? null,
      },
    });

    return user as User;
  }

  /**
   * Login with email + password.
   * Returns a signed JWT token.
   */
  async login(data: LoginInput): Promise<{ token: string; user: User }> {
    const user = await prisma.user.findFirst({
      where: { email: data.login },
      include: {
        specialty: true,
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    });

    if (!user) {
      throw unauthorized("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw unauthorized("Invalid credentials");
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      source: "web",
    });

    return { token, user: user as User };
  }

  /**
   * Get the current logged-in user by their ID.
   */
  async getMe(userId: number): Promise<User | null> {
    return (await prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialty: true,
        establishmentUsers: {
          include: {
            establishment: true,
          },
        },
      },
    })) as User | null;
  }
}
