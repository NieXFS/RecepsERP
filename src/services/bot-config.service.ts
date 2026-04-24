import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  DEFAULT_BOT_FALLBACK_MESSAGE,
  DEFAULT_BOT_GREETING_MESSAGE,
  DEFAULT_BOT_NAME,
  DEFAULT_BOT_SYSTEM_PROMPT,
  META_CONNECTION_SOURCES,
  type MetaConnectionSource,
} from "@/lib/bot-config";
import type {
  AdminBotConfigInput,
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
  metaConnectionSource: MetaConnectionSource | null;
  metaConnectedAt: string | null;
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

export type AdminBotConfigRecord = {
  exists: boolean;
  tenantId: string;
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
  wabaId: string | null;
  phoneNumberId: string | null;
  waAccessToken: string | null;
  waVerifyToken: string | null;
  waRegistrationPin: string | null;
  waApiVersion: string;
  isActive: boolean;
};

export type EmbeddedSignupBotConfigInput = {
  wabaId: string;
  phoneNumberId: string;
  waAccessToken: string;
  waApiVersion: string;
  waRegistrationPin: string;
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
    metaConnectionSource: null,
    metaConnectedAt: null,
  };
}

function createDefaultAdminBotConfig(tenantId: string): AdminBotConfigRecord {
  return {
    exists: false,
    tenantId,
    botName: DEFAULT_BOT_NAME,
    systemPrompt: DEFAULT_BOT_SYSTEM_PROMPT,
    greetingMessage: DEFAULT_BOT_GREETING_MESSAGE,
    fallbackMessage: DEFAULT_BOT_FALLBACK_MESSAGE,
    aiModel: "gpt-4o-mini",
    aiTemperature: 0.4,
    aiMaxTokens: 500,
    openaiApiKey: null,
    botIsAlwaysActive: false,
    botActiveStart: "08:00",
    botActiveEnd: "20:00",
    timezone: "America/Sao_Paulo",
    wabaId: null,
    phoneNumberId: null,
    waAccessToken: null,
    waVerifyToken: null,
    waRegistrationPin: null,
    waApiVersion: "v21.0",
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

async function assertSuperAdminActor(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, globalRole: true },
  });

  if (!user || user.globalRole !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao time interno da Receps.");
  }
}

async function getEditableTenantForAdmin(tenantId: string) {
  return db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
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
      metaConnectionSource: true,
      metaConnectedAt: true,
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
    metaConnectionSource: isMetaConnectionSource(botConfig.metaConnectionSource)
      ? botConfig.metaConnectionSource
      : null,
    metaConnectedAt: botConfig.metaConnectedAt?.toISOString() ?? null,
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

export async function getBotConfigByTenantIdAdmin(
  tenantId: string,
  actorUserId: string
): Promise<AdminBotConfigRecord | null> {
  await assertSuperAdminActor(actorUserId);

  const tenant = await getEditableTenantForAdmin(tenantId);
  if (!tenant) {
    return null;
  }

  const botConfig = await db.botConfig.findUnique({
    where: { tenantId },
  });

  if (!botConfig) {
    return createDefaultAdminBotConfig(tenantId);
  }

  return {
    exists: true,
    tenantId,
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
    wabaId: botConfig.wabaId ?? null,
    phoneNumberId: botConfig.phoneNumberId ?? null,
    waAccessToken: botConfig.waAccessToken ?? null,
    waVerifyToken: botConfig.waVerifyToken ?? null,
    waRegistrationPin: botConfig.waRegistrationPin ?? null,
    waApiVersion: botConfig.waApiVersion,
    isActive: botConfig.isActive,
  };
}

function isMetaConnectionSource(value: string | null | undefined): value is MetaConnectionSource {
  return (
    value === META_CONNECTION_SOURCES.MANUAL ||
    value === META_CONNECTION_SOURCES.EMBEDDED_SIGNUP
  );
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
      systemPrompt: input.systemPrompt,
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
      systemPrompt: input.systemPrompt,
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

export async function connectBotConfigViaEmbeddedSignup(
  tenantId: string,
  input: EmbeddedSignupBotConfigInput
): Promise<ActionResult<{ tenantId: string; phoneNumberId: string }>> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { success: false, error: "Estabelecimento não encontrado." };
  }

  const existing = await db.botConfig.findUnique({
    where: { tenantId },
    select: {
      waApiVersion: true,
    },
  });

  const connectedAt = new Date();
  const nextApiVersion = existing?.waApiVersion?.trim() || input.waApiVersion;

  try {
    await db.botConfig.upsert({
      where: { tenantId },
      update: {
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        waAccessToken: input.waAccessToken,
        waRegistrationPin: input.waRegistrationPin,
        waApiVersion: nextApiVersion,
        metaConnectionSource: META_CONNECTION_SOURCES.EMBEDDED_SIGNUP,
        metaConnectedAt: connectedAt,
        isActive: true,
        activatedAt: connectedAt,
      },
      create: {
        ...getDefaultBotConfigCreateData(tenantId),
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        waAccessToken: input.waAccessToken,
        waRegistrationPin: input.waRegistrationPin,
        waApiVersion: nextApiVersion,
        metaConnectionSource: META_CONNECTION_SOURCES.EMBEDDED_SIGNUP,
        metaConnectedAt: connectedAt,
        isActive: true,
        activatedAt: connectedAt,
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
      error instanceof Error ? error.message : "Não foi possível concluir a conexão do WhatsApp.";
    return { success: false, error: message };
  }

  return {
    success: true,
    data: {
      tenantId,
      phoneNumberId: input.phoneNumberId,
    },
  };
}

export async function createInitialBotConfigAdmin(
  tenantId: string,
  actorUserId: string
): Promise<ActionResult<{ tenantId: string }>> {
  await assertSuperAdminActor(actorUserId);

  const tenant = await getEditableTenantForAdmin(tenantId);
  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  await db.botConfig.upsert({
    where: { tenantId },
    update: {},
    create: {
      ...getDefaultBotConfigCreateData(tenantId),
      isActive: false,
      activatedAt: null,
    },
  });

  console.info(
    `[admin-bot-config] configuração inicial criada | tenantId=${tenantId} | userId=${actorUserId}`
  );

  return { success: true, data: { tenantId } };
}

export async function upsertBotConfigAdmin(
  tenantId: string,
  input: AdminBotConfigInput,
  actorUserId: string
): Promise<ActionResult<{ botName: string; tenantId: string }>> {
  await assertSuperAdminActor(actorUserId);

  const tenant = await getEditableTenantForAdmin(tenantId);
  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  const previous = await db.botConfig.findUnique({
    where: { tenantId },
    select: {
      systemPrompt: true,
      waAccessToken: true,
      openaiApiKey: true,
    },
  });

  try {
    await db.botConfig.upsert({
      where: { tenantId },
      update: {
        botName: input.botName,
        systemPrompt: input.systemPrompt,
        greetingMessage: input.greetingMessage || null,
        fallbackMessage: input.fallbackMessage || null,
        aiModel: input.aiModel,
        aiTemperature: input.aiTemperature,
        aiMaxTokens: input.aiMaxTokens,
        openaiApiKey: input.openaiApiKey || null,
        botIsAlwaysActive: input.botIsAlwaysActive,
        botActiveStart: input.botActiveStart,
        botActiveEnd: input.botActiveEnd,
        timezone: input.timezone,
        wabaId: input.wabaId || null,
        phoneNumberId: input.phoneNumberId || null,
        waAccessToken: input.waAccessToken || null,
        waVerifyToken: input.waVerifyToken || null,
        waApiVersion: input.waApiVersion,
        isActive: input.isActive,
        activatedAt: input.isActive ? new Date() : null,
      },
      create: {
        ...getDefaultBotConfigCreateData(tenantId),
        botName: input.botName,
        systemPrompt: input.systemPrompt,
        greetingMessage: input.greetingMessage || null,
        fallbackMessage: input.fallbackMessage || null,
        aiModel: input.aiModel,
        aiTemperature: input.aiTemperature,
        aiMaxTokens: input.aiMaxTokens,
        openaiApiKey: input.openaiApiKey || null,
        botIsAlwaysActive: input.botIsAlwaysActive,
        botActiveStart: input.botActiveStart,
        botActiveEnd: input.botActiveEnd,
        timezone: input.timezone,
        wabaId: input.wabaId || null,
        phoneNumberId: input.phoneNumberId || null,
        waAccessToken: input.waAccessToken || null,
        waVerifyToken: input.waVerifyToken || null,
        waApiVersion: input.waApiVersion,
        isActive: input.isActive,
        activatedAt: input.isActive ? new Date() : null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Esse phoneNumberId já está vinculado a outro tenant.",
      };
    }

    const message =
      error instanceof Error ? error.message : "Não foi possível salvar a configuração do bot.";
    return { success: false, error: message };
  }

  const changedSensitiveFields = [
    previous?.systemPrompt !== input.systemPrompt ? "systemPrompt" : null,
    previous?.waAccessToken !== (input.waAccessToken || null) ? "waAccessToken" : null,
    previous?.openaiApiKey !== (input.openaiApiKey || null) ? "openaiApiKey" : null,
  ].filter((value): value is string => Boolean(value));

  if (changedSensitiveFields.length > 0) {
    console.info(
      `[admin-bot-config] campos sensíveis alterados | tenantId=${tenantId} | userId=${actorUserId} | fields=${changedSensitiveFields.join(",")}`
    );
  }

  return {
    success: true,
    data: {
      botName: input.botName,
      tenantId,
    },
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
        metaConnectionSource: META_CONNECTION_SOURCES.MANUAL,
        metaConnectedAt: new Date(),
        isActive: true,
        activatedAt: new Date(),
      },
      create: {
        ...getDefaultBotConfigCreateData(tenant.id),
        wabaId: input.wabaId,
        phoneNumberId: input.phoneNumberId,
        waAccessToken: input.waAccessToken,
        waVerifyToken: input.waVerifyToken,
        metaConnectionSource: META_CONNECTION_SOURCES.MANUAL,
        metaConnectedAt: new Date(),
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
