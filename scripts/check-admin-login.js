/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { scryptSync, timingSafeEqual } = require('crypto');

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'demo@progressionlab.ai' },
      select: { id: true, email: true, role: true, passwordHash: true },
    });

    if (!user) {
      console.log({ exists: false });
      return;
    }

    let passwordMatches = false;
    if (user.passwordHash) {
      const [scheme, salt, hash] = user.passwordHash.split('$');
      if (scheme === 'scrypt' && salt && hash) {
        const candidate = scryptSync('Admin123!ChangeMe', salt, 64).toString('hex');
        const candidateBuffer = Buffer.from(candidate, 'hex');
        const hashBuffer = Buffer.from(hash, 'hex');
        passwordMatches =
          candidateBuffer.length === hashBuffer.length &&
          timingSafeEqual(candidateBuffer, hashBuffer);
      }
    }

    console.log({
      exists: true,
      email: user.email,
      role: user.role,
      hasPasswordHash: Boolean(user.passwordHash),
      passwordMatches,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
