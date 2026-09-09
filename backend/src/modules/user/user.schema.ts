import { z } from "zod";
import { UserRole } from "../../../prisma/interfaces.js";
import hashId from "../../utils/hashId.js";

const parseHashOrNumber = (val: unknown) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const decoded = hashId.decodeId(val);
    if (decoded !== null) return decoded;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
};

export const createUserSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((val) => val.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    role: z.nativeEnum(UserRole),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    licenseNumber: z.string().optional(),
    specialtyId: z.preprocess(parseHashOrNumber, z.number().optional()),
    bio: z.string().optional(),
    establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1, "First name cannot be empty").optional(),
    lastName: z.string().min(1, "Last name cannot be empty").optional(),
    email: z
      .string()
      .email("Invalid email address")
      .transform((val) => val.toLowerCase())
      .optional(),
    password: z.string().min(6, "Password must be at least 6 characters long").optional(),
    phone: z.string().nullable().optional(),
    role: z.nativeEnum(UserRole).optional(),
    dateOfBirth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    licenseNumber: z.string().nullable().optional(),
    specialtyId: z.preprocess(parseHashOrNumber, z.number().nullable().optional()),
    bio: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const searchUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  establishmentId: z.preprocess(parseHashOrNumber, z.number().optional()),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().min(1).default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 10), z.number().min(1).max(100).default(10)),
});
export type SearchUserQueryInput = z.infer<typeof searchUserQuerySchema>;

export const UpdateUserPasswordSchema = z
  .object({
    currentPassword: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  })
  .strict();
export type UpdateUserPasswordInput = z.infer<typeof UpdateUserPasswordSchema>;

export const forgetPasswordSchema = z
  .object({
    email: z.string().email().transform((val) => val.toLowerCase()),
  })
  .strict();
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    token: z.string(),
  })
  .strict();
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
