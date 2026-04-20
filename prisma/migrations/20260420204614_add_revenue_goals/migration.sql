-- CreateTable
CREATE TABLE "revenue_goals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_goals_tenantId_idx" ON "revenue_goals"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_goals_tenantId_month_key" ON "revenue_goals"("tenantId", "month");

-- AddForeignKey
ALTER TABLE "revenue_goals" ADD CONSTRAINT "revenue_goals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_goals" ADD CONSTRAINT "revenue_goals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
