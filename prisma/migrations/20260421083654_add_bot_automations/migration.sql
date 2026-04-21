-- CreateEnum
CREATE TYPE "BotAutomationType" AS ENUM ('BIRTHDAY', 'INACTIVE', 'POST_APPOINTMENT', 'RESCHEDULE');

-- CreateEnum
CREATE TYPE "MetaTemplateStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "BotAutomationLogStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BotAutomationSkipReason" AS ENUM ('OPT_OUT', 'NO_PHONE', 'TEMPLATE_NOT_APPROVED', 'ALREADY_SENT', 'DISABLED');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "optOutAutomations" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bot_automations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "BotAutomationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "templateText" TEXT NOT NULL,
    "windowDays" INTEGER,
    "metaTemplateName" TEXT,
    "metaTemplateLanguage" TEXT NOT NULL DEFAULT 'pt_BR',
    "metaCategory" TEXT NOT NULL DEFAULT 'MARKETING',
    "metaTemplateStatus" "MetaTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTemplateRejectionReason" TEXT,
    "metaLastSyncedAt" TIMESTAMP(3),
    "variableMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_automation_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "automationType" "BotAutomationType" NOT NULL,
    "automationId" TEXT,
    "appointmentId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BotAutomationLogStatus" NOT NULL,
    "skipReason" "BotAutomationSkipReason",
    "errorMessage" TEXT,
    "metaMessageId" TEXT,
    "renderedMessage" TEXT NOT NULL,

    CONSTRAINT "bot_automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_automations_tenantId_idx" ON "bot_automations"("tenantId");

-- CreateIndex
CREATE INDEX "bot_automations_metaTemplateStatus_idx" ON "bot_automations"("metaTemplateStatus");

-- CreateIndex
CREATE UNIQUE INDEX "bot_automations_tenantId_type_key" ON "bot_automations"("tenantId", "type");

-- CreateIndex
CREATE INDEX "bot_automation_logs_tenantId_sentAt_idx" ON "bot_automation_logs"("tenantId", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "bot_automation_logs_tenantId_customerId_automationType_sent_idx" ON "bot_automation_logs"("tenantId", "customerId", "automationType", "sentAt");

-- CreateIndex
CREATE INDEX "bot_automation_logs_tenantId_status_idx" ON "bot_automation_logs"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "bot_automations" ADD CONSTRAINT "bot_automations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_automation_logs" ADD CONSTRAINT "bot_automation_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_automation_logs" ADD CONSTRAINT "bot_automation_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_automation_logs" ADD CONSTRAINT "bot_automation_logs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "bot_automations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
