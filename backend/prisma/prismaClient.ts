// Re-export the singleton Prisma client from src/prisma/client.ts
// This file exists at `prisma/prismaClient.ts` to satisfy legacy imports
// from modules that use `../../../prisma/prismaClient`
export { prisma as default } from '../src/prisma/client.js';
