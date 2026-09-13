import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://royal_honey_user:royal_honey_password@localhost:5432/royal_honey_db?schema=public';

const adapter = new PrismaPg(connectionString);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
