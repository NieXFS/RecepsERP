-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "payoutId" TEXT;

-- CreateTable
CREATE TABLE "commission_payouts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "commissionCount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "financialAccountId" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commission_payouts_transactionId_key" ON "commission_payouts"("transactionId");

-- CreateIndex
CREATE INDEX "commission_payouts_tenantId_idx" ON "commission_payouts"("tenantId");

-- CreateIndex
CREATE INDEX "commission_payouts_tenantId_professionalId_idx" ON "commission_payouts"("tenantId", "professionalId");

-- CreateIndex
CREATE INDEX "commission_payouts_tenantId_paidAt_idx" ON "commission_payouts"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "commissions_payoutId_idx" ON "commissions"("payoutId");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "commission_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
