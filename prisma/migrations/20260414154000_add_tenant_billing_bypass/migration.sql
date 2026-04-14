ALTER TABLE "tenants"
ADD COLUMN "billingBypassEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "billingBypassReason" TEXT,
ADD COLUMN "billingBypassUpdatedAt" TIMESTAMP(3);
