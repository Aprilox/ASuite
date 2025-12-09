import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Trouver la racine du monorepo (où se trouve turbo.json)
function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, 'turbo.json'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const MONOREPO_ROOT = findMonorepoRoot();

// Charger le .env depuis la racine
config({ path: resolve(MONOREPO_ROOT, '.env') });

// Construire le chemin vers dev.db (à la racine du monorepo)
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')) {
    return process.env.DATABASE_URL;
  }
  // Pour SQLite en dev, utiliser le chemin absolu vers dev.db à la racine
  const dbPath = resolve(MONOREPO_ROOT, 'dev.db');
  return `file:${dbPath.replace(/\\/g, '/')}`;
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: getDatabaseUrl(),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export default prisma;

