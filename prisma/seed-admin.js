/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_SEED_EMAIL || 'demo@progressionlab.ai';
const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin123!ChangeMe';
const adminName = process.env.ADMIN_SEED_NAME || 'Demo Admin';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      name: adminName,
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: hashPassword(adminPassword),
      role: 'ADMIN',
    },
  });

  console.log('Admin seed completed');
  console.log(`Login email: ${adminEmail}`);
  console.log(`Login password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
