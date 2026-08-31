import { z } from 'zod';
import { EstablishmentUserRole } from '../../../prisma/interfaces.js';
import hashId from '../../utils/hashId.js';

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

export const createEstablishmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
});
export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>;

export const updateEstablishmentSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>;

export const addEstablishmentUserSchema = z.object({
  userId: z.preprocess(parseHashOrNumber, z.number({ message: 'User ID is required' })),
  role: z.nativeEnum(EstablishmentUserRole),
});
export type AddEstablishmentUserInput = z.infer<typeof addEstablishmentUserSchema>;

export const searchEstablishmentQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});
export type SearchEstablishmentQueryInput = z.infer<typeof searchEstablishmentQuerySchema>;
