-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

