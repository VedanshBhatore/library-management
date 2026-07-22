import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient instance, reused across routes and the seed
// script so we don't exhaust DB connections by creating one per request.
export const prisma = new PrismaClient();
