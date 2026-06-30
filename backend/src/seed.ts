import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const hashed = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@biplatform.com' },
    update: {},
    create: {
      email: 'admin@biplatform.com',
      password: hashed,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'analyst@biplatform.com' },
    update: {},
    create: {
      email: 'analyst@biplatform.com',
      password: hashed,
      firstName: 'Analyst',
      lastName: 'User',
      role: 'ANALYST',
      isActive: true,
    },
  });

  console.log('Seed completed');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
