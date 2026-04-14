ALTER TABLE "bot_configs"
ADD COLUMN "botIsAlwaysActive" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "bot_configs"
ALTER COLUMN "aiTemperature" SET DEFAULT 0.4;
