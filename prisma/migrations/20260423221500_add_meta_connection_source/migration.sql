ALTER TABLE "bot_configs"
ADD COLUMN "waRegistrationPin" TEXT,
ADD COLUMN "metaConnectionSource" TEXT,
ADD COLUMN "metaConnectedAt" TIMESTAMP(3);
