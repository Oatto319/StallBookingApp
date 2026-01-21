import { PrismaClient } from '@prisma/client'

// ป้องกันการสร้าง Connection เยอะเกินไปเวลา Dev
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// ✅ ต้องมี export ตรงนี้
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma