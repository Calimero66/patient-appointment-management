import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .transform((val) => val.toLowerCase()),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
  })
  .strip();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    login: z.string().min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strip();

export type LoginInput = z.infer<typeof loginSchema>;
