-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "pinConfiguredAt" TIMESTAMP(3),
ADD COLUMN     "pinLastChangedAt" TIMESTAMP(3);
