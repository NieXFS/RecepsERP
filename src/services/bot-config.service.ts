import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  DEFAULT_BOT_FALLBACK_MESSAGE,
  DEFAULT_BOT_GREETING_MESSAGE,
  DEFAULT_BOT_NAME,
  DEFAULT_BOT_SYSTEM_PROMPT,
} from "@/lib/bot-config";
import type {
  AdminBotLinkInput,
  BotConfigSettingsInput,
} from "@/lib/validators/bot-config";
import type { ActionResult } from "@/types";

export type BotSettingsRecord = {
  botName: string;
  systemPrompt: string;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  botIsAlwaysActive: boolean;
  botActiveStart: string;
  botActiveEnd: string;
  timezone: string;
  phoneNumberId: string | null;
  isActive: boolean;
};

export type TenantBotRuntimeConfig = {
  tenantSlug: string;
  botName: string;
  systemPrompt: string;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  openaiApiKey: string | null;
  botIsAlwaysActive: boolean;
  botActiveStart: string;
  botActiveEnd: string;
  timezone: string;
  waAccessToken: string;
  waApiVersion: string;
  phoneNumberId: string;
  isActive: boolean;
};

function createDefaultBotSettings(): BotSettingsRecord {
  return {
    botName: DEFAULT_BOT_NAME,
    systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
    greetingMessage: DEFAULT_BOT_GREETING_MESSAGE,
    fallbackMessage: DEFAULT_BOT_FALLBACK_MESSAGE,
    botIsAlwaysActive: false,
    botActiveStart: "08:00",
    botActiveEnd: "20:00",
    timezone: "America/Sao_Paulo",
    phoneNumberId: null,
    isActive: false,
  };
}

function getDefaultBotConfigCreateData(tenantId: string) {
  return {
    tenantId,
    botName: DEFAULT_BOT_NAME,
    systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
    greetingMessage: DEFAULT_BOT_GREETING_MESSAGE,
    fallbackMessage: DEFAULT_BOT_FALLBACK_MESSAGE,
    aiProvider: "openai",
    aiModel: "gpt-4o-mini",
    aiTemperature: 0.4,
    aiMaxTokens: 500,
    botIsAlwaysActive: false,
    botActiveStart: "08:00",
    botActiveEnd: "20:00",
    timezone: "America/Sao_Paulo",
    waApiVersion: "v21.0",
  } satisfies Prisma.BotConfigUncheckedCreateInput;
}

export async function getBotConfigByTenantId(
  tenantId: string
): Promise<BotSettingsRecord> {
  const botConfig = await db.botConfig.findUnique({
    where: { tenantId },
    select: {
      botName: true,
      systemPrompt: true,
      greetingMessage: true,
      fallbackMessage: true,
      botIsAlwaysActive: true,
      botActiveStart: true,
      botActiveEnd: true,
      timezone: true,
      phoneNumberId: true,
      isActive: true,
    },
  });

  if (!botConfig) {
    return createDefaultBotSettings();
  }

  return {
    botName: botConfig.botName,
    systemPrompt: botConfig.systemPrompt,
    greetingMessage: botConfig.greetingMessage,
    fallbackMessage: botConfig.fallbackMessage,
    botIsAlwaysActive: botConfig.botIsAlwaysActive,
    botActiveStart: botConfig.botActiveStart,
    botActiveEnd: botConfig.botActiveEnd,
    timezone: botConfig.timezone,
    phoneNumberId: botConfig.phoneNumberId,
    isActive: botConfig.isActive,
  };
}

export async function getBotConfigByPhoneNumberId(
  phoneNumberId: string
): Promise<TenantBotRuntimeConfig | null> {
  const botConfig = await db.botConfig.findUnique({
    where: { phoneNumberId },
    include: {
      tenant: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (
    !botConfig ||
    !botConfig.isActive ||
    !botConfig.phoneNumberId ||
    !botConfig.waAccessToken
  ) {
    return null;
  }

  return {
    tenantSlug: botConfig.tenant.slug,
    botName: botConfig.botName,
    systemPrompt: botConfig.systemPrompt,
    greetingMessage: botConfig.greetingMessage,
    fallbackMessage: botConfig.fallbackMessage,
    aiModel: botConfig.aiModel,
    aiTemperature: botConfig.aiTemperature,
    aiMaxTokens: botConfig.aiMaxTokens,
    openaiApiKey: botConfig.openaiApiKey ?? null,
    botIsAlwaysActive: botConfig.botIsAlwaysActive,
    botActiveStart: botConfig.botActiveStart,
    botActiveEnd: botConfig.botActiveEnd,
    timezone: botConfig.timezone,
    waAccessToken: botConfig.waAccessToken,
    waApiVersion: botConfig.waApiVersion,
    phoneNumberId: botConfig.phoneNumberId,
    isActive: botConfig.isActive,
  };
}

export async function hasActiveBotVerifyToken(
  waVerifyToken: string
): Promise<boolean> {
  const count = await db.botConfig.count({
    where: {
      waVerifyToken,
      isActive: true,
    },
  });

  return count > 0;
}

export async function upsertBotConfig(
  tenantId: string,
  input: BotConfigSettingsInput
): Promise<ActionResult<{ botName: string }>> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { success: false, error: "Estabelecimento não encontrado." };
  }

  await db.botConfig.upsert({
    where: { tenantId },
    update: {
      botName: input.botName,
      greetingMessage: input.greetingMessage || null,
      fallbackMessage: input.fallbackMessage || null,
      botIsAlwaysActive: input.botIsAlwaysActive,
      botActiveStart: input.botActiveStart,
      botActiveEnd: input.botActiveEnd,
      timezone: input.timezone,
    },
    create: {
      ...getDefaultBotConfigCreateData(tenantId),
      botName: input.botName,
      greetingMessage: input.greetingMessage || null,
      fallbackMessage: input.fallbackMessage || null,
      botIsAlwaysActive: input.botIsAlwaysActive,
      botActiveStart: input.botActiveStart,
      botActiveEnd: input.botActiveEnd,
      timezone: input.timezone,
      isActive: false,
      activatedAt: null,
    },
  });

  return {
    success: true,
    data: { botName: input.botName },
  };
}

export async function linkBotConfigToTenant(
  input: AdminBotLinkInput
): Promise<ActionResult<{ tenantSlug: string; phoneNumberId: string }>> {
  const tenant = await db.tenant.findUnique({
    where: { slug: input.tenantSlug },
    select: { id: true, slug: true },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  try {
    await db.botConfig.upsert({
      where: { tenantId: tenant.id },
      update: {
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        waAccessToken: input.waAccessToken,
        waVerifyToken: input.waVerifyToken,
        isActive: true,
        activatedAt: new Date(),
      },
      create: {
        ...getDefaultBotConfigCreateData(tenant.id),
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        waAccessToken: input.waAccessToken,
        waVerifyToken: input.waVerifyToken,
        isActive: true,
        activatedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Esse número WhatsApp já está vinculado a outro tenant.",
      };
    }

    const message =
      error instanceof Error ? error.message : "Não foi possível vincular o número.";
    return { success: false, error: message };
  }

  return {
    success: true,
    data: {
      tenantSlug: tenant.slug,
      phoneNumberId: input.phoneNumberId,
    },
  };
}
