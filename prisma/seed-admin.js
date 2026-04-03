/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_SEED_EMAIL || 'demo@progressionlab.ai';
const adminName = process.env.ADMIN_SEED_NAME || 'Demo Admin';

function getAdminMfaBypassUntil() {
  const configuredValue = process.env.ADMIN_SEED_MFA_BYPASS_UNTIL?.trim();

  if (configuredValue) {
    if (configuredValue.toLowerCase() === 'none') {
      return null;
    }

    const parsed = new Date(configuredValue);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('ADMIN_SEED_MFA_BYPASS_UNTIL must be a valid ISO date or "none"');
    }

    return parsed;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const bypass = new Date();
  bypass.setFullYear(bypass.getFullYear() + 5);
  return bypass;
}

function getRequiredAdminPassword() {
  const password = process.env.ADMIN_SEED_PASSWORD && process.env.ADMIN_SEED_PASSWORD.trim();

  if (!password) {
    throw new Error('ADMIN_SEED_PASSWORD must be set before running the admin seed');
  }

  return password;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const adminPassword = getRequiredAdminPassword();
  const mfaBypassUntil = getAdminMfaBypassUntil();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      name: adminName,
      passwordHash: hashPassword(adminPassword),
      mfaBypassUntil,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: hashPassword(adminPassword),
      role: 'ADMIN',
      mfaBypassUntil,
    },
  });

  console.log('✅ Admin seed completed successfully');
  console.log(`📧 Admin email: ${adminEmail}`);
  console.log(
    mfaBypassUntil
      ? `🔓 MFA bypass active until: ${mfaBypassUntil.toISOString()}`
      : '🔐 MFA bypass disabled; security key enrollment required for admin login',
  );
  console.log(
    '⚠️ Password not logged to console for security - use environment variable provided during deployment',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
