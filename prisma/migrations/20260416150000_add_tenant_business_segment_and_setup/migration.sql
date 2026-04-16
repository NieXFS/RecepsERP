-- CreateEnum
CREATE TYPE "TenantBusinessSegment" AS ENUM (
  'CLINICA_ESTETICA',
  'BARBEARIA',
  'SALAO_BELEZA',
  'ODONTOLOGIA',
  'CENTRO_ESTETICO',
  'STUDIO_BELEZA',
  'OUTRO'
);

-- AlterTable
ALTER TABLE "tenants"
  ADD COLUMN "businessSegment" "TenantBusinessSegment",
  ADD COLUMN "setupCompletedAt" TIMESTAMP(3),
  ADD COLUMN "setupSkippedAt" TIMESTAMP(3);

-- Backfill: tenants já ativos (pré-wizard) são tratados como setup concluído
-- para não ficarem presos no fluxo /bem-vindo.
UPDATE "tenants"
SET "setupCompletedAt" = COALESCE("updatedAt", NOW())
WHERE "lifecycleStatus" = 'ACTIVE' AND "setupCompletedAt" IS NULL;
