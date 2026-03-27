-- Add USER as a valid role for non-admin accounts
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';
