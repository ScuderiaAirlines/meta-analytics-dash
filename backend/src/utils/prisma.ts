import { PrismaClient } from '@prisma/client';
import Logger from './logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test database connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    Logger.info('✅ Database connected successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    Logger.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    Logger.info('Database disconnected');
  } catch (error) {
    Logger.error('Error disconnecting database:', error);
  }
}

export default prisma;
