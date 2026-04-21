-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'STATUS_CHANGE',
    'PAYMENT_MARKED',
    'CASH_OPENED',
    'CASH_CLOSED',
    'COMMISSION_PAID',
    'PAYOUT_CREATED',
    'CASH_WITHDRAWAL',
    'CASH_REINFORCEMENT',
    'GOAL_SET'
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "userNameSnapshot" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "snapshot" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_entityType_entityId_idx" ON "audit_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_userId_idx" ON "audit_logs"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
