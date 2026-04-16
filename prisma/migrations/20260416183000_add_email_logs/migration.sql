-- CreateTable
CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "providerId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_tenantId_template_createdAt_idx"
ON "email_logs"("tenantId", "template", "createdAt");

-- AddForeignKey
ALTER TABLE "email_logs"
ADD CONSTRAINT "email_logs_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
