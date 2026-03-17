import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'demo@progressionlab.ai' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@progressionlab.ai',
      name: 'Demo User',
    },
  });

  console.log('Seed completed: demo user created');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
