-- Set default role to USER for new users
ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'USER';
