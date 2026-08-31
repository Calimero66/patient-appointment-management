import { UserRepository } from "./user.repository.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { User, UserRole } from "../../../prisma/interfaces.js";
import { CreateUserInput, SearchUserQueryInput, UpdateUserInput, UpdateUserPasswordInput } from "./user.schema.js";
import { conflict, forbidden, internal, notFound, validationError } from "../../utils/errors.js";
import { UserUpdateInput } from "./user.types.js";
import prisma from "../../prisma/client.js";
import { AuditLogService } from "../auditLog/auditLog.service.js";

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private auditLogService?: AuditLogService
  ) {}

  /**
   * Admin Endpoint: Create user (Doctor, Patient, Super Admin, Establishment Admin).
   * Accessible by Super Admin and Establishment Admin.
   */
  async createUser(creatorId: number, creatorRole: UserRole, data: CreateUserInput): Promise<User> {
    if (creatorRole === UserRole.ESTABLISHMENT_ADMIN) {
      if (data.role !== UserRole.DOCTOR && data.role !== UserRole.PATIENT) {
        throw forbidden("Establishment Admins can only create Doctor or Patient accounts");
      }
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw conflict("Email");
    }

    if (data.licenseNumber) {
      const existingLicense = await prisma.user.findFirst({
        where: { licenseNumber: data.licenseNumber },
      });
      if (existingLicense) {
        throw conflict("License number");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        role: data.role,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender ?? null,
        address: data.address ?? null,
        licenseNumber: data.licenseNumber ?? null,
        bio: data.bio ?? null,
      },
    });

    // Link doctor or establishment admin to establishment
    let targetEstablishmentId = data.establishmentId;
    if (!targetEstablishmentId && creatorRole === UserRole.ESTABLISHMENT_ADMIN) {
      const adminEst = await prisma.establishmentUser.findFirst({
        where: { userId: creatorId, role: "ADMIN" },
      });
      if (adminEst) {
        targetEstablishmentId = adminEst.establishmentId;
      }
    }

    if (targetEstablishmentId && (data.role === UserRole.DOCTOR || data.role === UserRole.ESTABLISHMENT_ADMIN)) {
      await prisma.establishmentUser.create({
        data: {
          establishmentId: targetEstablishmentId,
          userId: user.id,
          role: data.role === UserRole.ESTABLISHMENT_ADMIN ? "ADMIN" : "DOCTOR",
        },
      });
    }

    // Record Audit Log for User Creation
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: creatorId,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        newValue: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          licenseNumber: user.licenseNumber,
          establishmentId: targetEstablishmentId,
        },
      });
    }

    return (await this.findById(user.id)) || (user as User);
  }

  /**
   * Super Admin & Establishment Admin: Update User Details & Reset Password.
   */
  async updateUser(
    requestingUserId: number,
    requestingUserRole: UserRole,
    targetUserId: number,
    data: UpdateUserInput
  ): Promise<User> {
    const userToUpdate = await this.findById(targetUserId);

    if (requestingUserRole === UserRole.ESTABLISHMENT_ADMIN) {
      // Establishment Admin can only edit doctors in their establishment
      const adminEsts = await prisma.establishmentUser.findMany({
        where: { userId: requestingUserId, role: "ADMIN" },
        select: { establishmentId: true },
      });
      const adminEstIds = adminEsts.map((e) => e.establishmentId);

      const targetInEst = await prisma.establishmentUser.findFirst({
        where: {
          userId: targetUserId,
          establishmentId: { in: adminEstIds },
        },
      });

      if (!targetInEst && targetUserId !== requestingUserId) {
        throw forbidden("You can only modify doctors in your assigned establishment");
      }
    } else if (requestingUserRole !== UserRole.SUPER_ADMIN && targetUserId !== requestingUserId) {
      throw forbidden("Only Super Admin and Establishment Admin can modify user account details");
    }

    // Email conflict check
    if (data.email && data.email !== userToUpdate.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) throw conflict("Email already in use");
    }

    const updatePayload: UserUpdateInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      gender: data.gender,
      address: data.address,
      licenseNumber: data.licenseNumber,
      bio: data.bio,
      isActive: data.isActive,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : (data.dateOfBirth === null ? null : undefined),
    };

    // Password update
    if (data.password) {
      updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.userRepository.update(targetUserId, updatePayload);

    // If establishmentId changed or assigned
    if (data.establishmentId && (updatedUser.role === UserRole.DOCTOR || updatedUser.role === UserRole.ESTABLISHMENT_ADMIN)) {
      const existingLink = await prisma.establishmentUser.findFirst({
        where: { establishmentId: data.establishmentId, userId: targetUserId },
      });
      if (!existingLink) {
        await prisma.establishmentUser.create({
          data: {
            establishmentId: data.establishmentId,
            userId: targetUserId,
            role: updatedUser.role === UserRole.ESTABLISHMENT_ADMIN ? "ADMIN" : "DOCTOR",
          },
        });
      }
    }

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: requestingUserId,
        action: "UPDATE_USER",
        entity: "User",
        entityId: targetUserId,
        oldValue: { firstName: userToUpdate.firstName, lastName: userToUpdate.lastName, email: userToUpdate.email, role: userToUpdate.role },
        newValue: { firstName: updatedUser.firstName, lastName: updatedUser.lastName, email: updatedUser.email, role: updatedUser.role, passwordUpdated: !!data.password },
      });
    }

    return updatedUser;
  }

  /**
   * Admin Endpoint: Get / Search users (with optional name/email search and role/establishment filter).
   */
  async searchUsers(query: SearchUserQueryInput): Promise<{ users: User[]; totalCount: number }> {
    return await this.userRepository.searchUsers({
      search: query.search,
      role: query.role,
      establishmentId: query.establishmentId,
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Public / Patient / All Users: Get / Search doctors by name, email or establishment.
   */
  async getDoctors(query: { search?: string; establishmentId?: number; page?: number; limit?: number }): Promise<{ doctors: User[]; totalCount: number }> {
    return await this.userRepository.findDoctors(query);
  }

  /**
   * Doctor Endpoint: Get / Search patients belonging to the logged-in doctor.
   */
  async getDoctorPatients(
    doctorId: number,
    query: { search?: string; page?: number; limit?: number }
  ): Promise<{ patients: User[]; totalCount: number }> {
    return await this.userRepository.findPatientsByDoctor(doctorId, query);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw notFound("User");
    return user;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.findByRole(role);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async update(id: number, data: UserUpdateInput): Promise<User> {
    const updatedUser = await this.userRepository.update(id, data);
    if (!updatedUser) throw internal("Error updating user");
    return updatedUser;
  }

  async delete(id: number): Promise<User> {
    const deletedUser = await this.userRepository.delete(id);
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: id,
        action: "DELETE",
        entity: "User",
        entityId: id,
        oldValue: { email: deletedUser.email, role: deletedUser.role },
      });
    }
    return deletedUser;
  }

  async findByLogin(login: string): Promise<User | null> {
    return await this.userRepository.findByLogin(login);
  }

  async updatePassword(id: number, data: UpdateUserPasswordInput): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user || !user.passwordHash) {
      throw notFound("User not found or password not set");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw validationError("Current password is incorrect");
    }

    const isSameAsCurrent = await bcrypt.compare(data.password, user.passwordHash);
    if (isSameAsCurrent) {
      throw validationError("New password must be different from current password");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.userRepository.updatePassword(id, hashedPassword);

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: id,
        action: "UPDATE_PASSWORD",
        entity: "User",
        entityId: id,
      });
    }
  }

  async updateProfileImage(userId: number, imageUrl: string): Promise<void> {
    await this.update(userId, { profileImage: imageUrl });
    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: userId,
        action: "UPDATE_PROFILE_IMAGE",
        entity: "User",
        entityId: userId,
        newValue: { profileImage: imageUrl },
      });
    }
  }

  async forgetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (user) {
      (async () => {
        try {
          const rawToken = crypto.randomBytes(32).toString("hex");
          const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");
          const expires = addMinutes(new Date(), 30);

          await this.userRepository.update(user.id, {
            forgotPasswordToken: hashedToken,
            forgotPasswordExpires: expires,
          });

          console.log(`[ForgetPassword] Reset token for ${email}: ${rawToken}`);
          console.log(`[ForgetPassword] Link: ${process.env.FRONTEND_URL}/reset-password/${rawToken}`);
        } catch (err) {
          console.error("Forgot password background process failed:", err);
        }
      })();
    }

    return;
  }

  async validateForgetPasswordToken(token: string): Promise<User> {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await this.userRepository.findByForgotPasswordToken(hashedToken);
    if (
      !user ||
      !user.forgotPasswordExpires ||
      user.forgotPasswordExpires < new Date()
    ) {
      throw validationError("Invalid or expired token");
    }

    return user;
  }

  async resetPassword(token: string, password: string): Promise<User> {
    const user = await this.validateForgetPasswordToken(token);

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpires: null,
    });

    if (!updatedUser) throw internal("Error updating user");

    if (this.auditLogService) {
      await this.auditLogService.log({
        userId: user.id,
        action: "RESET_PASSWORD",
        entity: "User",
        entityId: user.id,
      });
    }

    return updatedUser;
  }
}
