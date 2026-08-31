import { User, UserRole } from "../../../prisma/interfaces.js";
import hashId from "../../utils/hashId.js";

export const userDto = (user: User) => {
  return {
    id: hashId.encodeId(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    licenseNumber: user.licenseNumber,
    bio: user.bio,
    profileImage: user.profileImage,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    establishments: (user as any).establishmentUsers
      ? (user as any).establishmentUsers.map((eu: any) => ({
          id: hashId.encodeId(eu.establishment?.id || eu.establishmentId),
          name: eu.establishment?.name || 'Establishment',
          role: eu.role,
        }))
      : undefined,
  };
};
