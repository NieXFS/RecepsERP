-- AlterTable
ALTER TABLE "bot_automations" ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "lastSyncStartedAt" TIMESTAMP(3),
ADD COLUMN     "metaTemplateVersion" INTEGER NOT NULL DEFAULT 1;
