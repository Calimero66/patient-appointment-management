import { Establishment, EstablishmentUser } from '../../../prisma/interfaces.js';
import hashId from '../../utils/hashId.js';

export const establishmentDto = (e: Establishment) => ({
  id: hashId.encodeId(e.id),
  name: e.name,
  type: e.type,
  address: e.address,
  city: e.city,
  phone: e.phone,
  email: e.email,
  isActive: e.isActive,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

export const establishmentUserDto = (eu: any) => ({
  id: hashId.encodeId(eu.id),
  establishmentId: hashId.encodeId(eu.establishmentId),
  userId: hashId.encodeId(eu.userId),
  role: eu.role,
  createdAt: eu.createdAt,
  user: eu.user ? {
    id: hashId.encodeId(eu.user.id),
    firstName: eu.user.firstName,
    lastName: eu.user.lastName,
    email: eu.user.email,
    role: eu.user.role,
  } : undefined,
  establishment: eu.establishment ? establishmentDto(eu.establishment) : undefined,
});
