-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather in existing accounts so this migration doesn't lock out users
-- created before the active flag existed. New signups still default to false.
UPDATE "Users" SET "active" = true;

