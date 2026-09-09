import { UserRole } from "../../../prisma/interfaces.js";

export interface UserUpdateInput {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  role?: UserRole;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  licenseNumber?: string | null;
  specialtyId?: number | null;
  bio?: string | null;
  profileImage?: string | null;
  isActive?: boolean;
  forgotPasswordToken?: string | null;
  forgotPasswordExpires?: Date | null;
}
