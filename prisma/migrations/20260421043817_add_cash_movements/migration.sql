-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('WITHDRAWAL', 'REINFORCEMENT');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "cashMovementReason" TEXT,
ADD COLUMN     "cashMovementType" "CashMovementType",
ADD COLUMN     "cashRegisterSessionId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_cashRegisterSessionId_idx" ON "transactions"("cashRegisterSessionId");

-- CreateIndex
CREATE INDEX "transactions_tenantId_cashMovementType_idx" ON "transactions"("tenantId", "cashMovementType");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashRegisterSessionId_fkey" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "cash_register_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: liga cada Transaction PAID a uma CashRegisterSession compatível
-- (mesmo tenant, mesma conta, paidAt dentro da janela openedAt → closedAt da sessão).
-- Só toca transações sem vínculo e ignora sessões cuja janela sobreponha (caso raro).
UPDATE "transactions" t
SET "cashRegisterSessionId" = s."id"
FROM "cash_register_sessions" s
WHERE t."cashRegisterSessionId" IS NULL
  AND t."accountId" IS NOT NULL
  AND t."accountId" = s."accountId"
  AND t."tenantId" = s."tenantId"
  AND t."paymentStatus" = 'PAID'
  AND t."paidAt" IS NOT NULL
  AND t."paidAt" >= s."openedAt"
  AND (s."closedAt" IS NULL OR t."paidAt" < s."closedAt");
