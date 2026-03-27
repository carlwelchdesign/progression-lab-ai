-- Add USER as a valid role for non-admin accounts.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';

-- Ensure newly created users default to USER.
ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'USER';
