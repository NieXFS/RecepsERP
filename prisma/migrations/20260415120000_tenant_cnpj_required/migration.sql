-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "cnpj" TEXT;

-- Backfill
UPDATE "tenants"
SET "cnpj" = regexp_replace("document", '\D', '', 'g')
WHERE "cnpj" IS NULL
  AND "document" IS NOT NULL
  AND length(regexp_replace("document", '\D', '', 'g')) = 14;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");
