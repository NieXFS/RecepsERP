import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/db";
import {
  AppointmentStatus,
  BotAutomationType,
  MetaTemplateStatus,
  BotAutomationLogStatus,
  BotAutomationSkipReason,
} from "@/generated/prisma/enums";
import type { BotAutomationModel } from "@/generated/prisma/models/BotAutomation";
import {
  AVAILABLE_VARS_BY_TYPE,
  convertToPositional,
  isValidVariableMap,
  renderForMeta,
  renderPreview,
  type VariableMapEntry,
} from "@/lib/automation-template";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  getMessageTemplateStatus,
  sendTemplateMessage,
} from "@/lib/whatsapp-cloud";
import type { SaveAutomationInput } from "@/lib/validators/bot-automation";

const DEFAULT_TEMPLATE_TEXT: Record<
  (typeof BotAutomationType)[keyof typeof BotAutomationType],
  string
> = {
  BIRTHDAY:
    "Feliz aniversário, {{nome}}! Aqui da {{negocio}} desejamos um dia cheio de alegrias. Se quiser comemorar com a gente, é só chamar por aqui.",
  INACTIVE:
    "Oi, {{nome}}! Sentimos sua falta aqui na {{negocio}}. Já faz um tempinho desde o seu último {{ultimo_servico}} com a gente. Se quiser agendar um horário, é só me chamar por aqui que organizo pra você.",
  POST_APPOINTMENT:
    "Oi, {{nome}}! Aqui é da {{negocio}}. Esperamos que o seu {{servico}} com {{profissional}} tenha sido ótimo. Se já quiser deixar o próximo horário reservado, é só chamar por aqui.",
  RESCHEDULE:
    "Oi, {{nome}}! Vi que o seu {{servico}} que estava marcado para {{data_original}} aqui na {{negocio}} não rolou. Quer que eu organize um novo horário pra você?",
};

const DEFAULT_CATEGORY: Record<
  (typeof BotAutomationType)[keyof typeof BotAutomationType],
  string
> = {
  BIRTHDAY: "MARKETING",
  INACTIVE: "MARKETING",
  POST_APPOINTMENT: "MARKETING",
  RESCHEDULE: "UTILITY",
};

const DEFAULT_WINDOW_DAYS: Record<
  (typeof BotAutomationType)[keyof typeof BotAutomationType],
  number | null
> = {
  BIRTHDAY: null,
  INACTIVE: 60,
  POST_APPOINTMENT: null,
  RESCHEDULE: null,
};

const VARIABLE_EXAMPLES: Record<string, string> = {
  nome: "Maria",
  negocio: "Receps Admin",
  servico: "Corte de cabelo",
  profissional: "Julia",
  data_original: "23/04 às 15h",
  ultimo_servico: "Corte de cabelo",
};

function capitalizeVarName(raw: string): string {
  return raw
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractNamedParams(
  bodyText: string
): Array<{ name: string; example: string }> {
  const pattern = /\{\{(\w+)\}\}/g;
  const seen = new Set<string>();
  const result: Array<{ name: string; example: string }> = [];
  for (const match of bodyText.matchAll(pattern)) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const example = VARIABLE_EXAMPLES[name] ?? capitalizeVarName(name);
    result.push({ name, example });
  }
  return result;
}

export type BotAutomationWithDerived = BotAutomationModel & {
  canSend: boolean;
  availableVars: readonly string[];
};

export type BotAutomationVM = {
  id: string;
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType];
  enabled: boolean;
  templateText: string;
  windowDays: number | null;
  metaTemplateName: string | null;
  metaTemplateLanguage: string;
  metaCategory: string;
  metaTemplateStatus: (typeof MetaTemplateStatus)[keyof typeof MetaTemplateStatus];
  metaTemplateRejectionReason: string | null;
  metaLastSyncedAt: string | null;
  availableVars: string[];
  canSend: boolean;
};

function decorate(row: BotAutomationModel): BotAutomationWithDerived {
  return {
    ...row,
    canSend: row.enabled && row.metaTemplateStatus === MetaTemplateStatus.APPROVED,
    availableVars: AVAILABLE_VARS_BY_TYPE[row.type],
  };
}

export function toBotAutomationVM(row: BotAutomationWithDerived): BotAutomationVM {
  return {
    id: row.id,
    type: row.type,
    enabled: row.enabled,
    templateText: row.templateText,
    windowDays: row.windowDays,
    metaTemplateName: row.metaTemplateName,
    metaTemplateLanguage: row.metaTemplateLanguage,
    metaCategory: row.metaCategory,
    metaTemplateStatus: row.metaTemplateStatus,
    metaTemplateRejectionReason: row.metaTemplateRejectionReason,
    metaLastSyncedAt: row.metaLastSyncedAt ? row.metaLastSyncedAt.toISOString() : null,
    availableVars: [...row.availableVars],
    canSend: row.canSend,
  };
}

export async function getAutomationsVMForTenant(
  tenantId: string
): Promise<BotAutomationVM[]> {
  const rows = await getAutomationsForTenant(tenantId);
  return rows.map(toBotAutomationVM);
}

function buildInitialVariableMap(
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType],
  templateText: string
): VariableMapEntry[] {
  const { variableMap } = convertToPositional(templateText, type);
  return variableMap;
}

export async function getOrCreateAutomation(
  tenantId: string,
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType]
): Promise<BotAutomationWithDerived> {
  const existing = await db.botAutomation.findUnique({
    where: { tenantId_type: { tenantId, type } },
  });
  if (existing) {
    return decorate(existing);
  }

  const templateText = DEFAULT_TEMPLATE_TEXT[type];
  const variableMap = buildInitialVariableMap(type, templateText);
  const created = await db.botAutomation.create({
    data: {
      tenantId,
      type,
      enabled: false,
      templateText,
      windowDays: DEFAULT_WINDOW_DAYS[type],
      metaCategory: DEFAULT_CATEGORY[type],
      metaTemplateStatus: MetaTemplateStatus.DRAFT,
      variableMap,
    },
  });
  return decorate(created);
}

export async function getAutomationsForTenant(
  tenantId: string
): Promise<BotAutomationWithDerived[]> {
  const types = Object.values(BotAutomationType);
  const rows = await Promise.all(
    types.map((type) => getOrCreateAutomation(tenantId, type))
  );
  return rows;
}

async function getTenantSlug(tenantId: string): Promise<string> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });
  return tenant?.slug ?? "tenant";
}

async function getBotCredentials(tenantId: string): Promise<{
  wabaId: string;
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
} | null> {
  const bc = await db.botConfig.findUnique({
    where: { tenantId },
    select: {
      wabaId: true,
      phoneNumberId: true,
      waAccessToken: true,
      waApiVersion: true,
    },
  });
  if (!bc || !bc.wabaId || !bc.phoneNumberId || !bc.waAccessToken) {
    return null;
  }
  return {
    wabaId: bc.wabaId,
    phoneNumberId: bc.phoneNumberId,
    accessToken: bc.waAccessToken,
    apiVersion: bc.waApiVersion,
  };
}

export async function saveAutomation(
  tenantId: string,
  input: SaveAutomationInput
): Promise<BotAutomationWithDerived> {
  const current = await getOrCreateAutomation(tenantId, input.type);

  const { variableMap } = convertToPositional(input.templateText, input.type);

  const textChanged = input.templateText !== current.templateText;
  const needsCreateTemplate =
    textChanged || current.metaTemplateName === null;

  let metaTemplateName = current.metaTemplateName;
  let metaTemplateStatus = current.metaTemplateStatus;
  let metaTemplateRejectionReason = current.metaTemplateRejectionReason;
  let metaLastSyncedAt = current.metaLastSyncedAt;

  if (needsCreateTemplate && input.enabled) {
    const credentials = await getBotCredentials(tenantId);
    if (!credentials) {
      throw new Error(
        "Configure o WhatsApp (wabaId, phoneNumberId e accessToken) antes de ativar a automação."
      );
    }
    const slug = await getTenantSlug(tenantId);
    const safeSlug = slug.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const newName = `receps_${input.type.toLowerCase()}_${safeSlug}_${Date.now().toString(36)}`;

    const namedParams = extractNamedParams(input.templateText);
    const created = await createMessageTemplate({
      wabaId: credentials.wabaId,
      accessToken: credentials.accessToken,
      apiVersion: credentials.apiVersion,
      name: newName,
      category: current.metaCategory,
      languageCode: current.metaTemplateLanguage,
      bodyText: input.templateText,
      namedParams: namedParams.length > 0 ? namedParams : undefined,
    });

    metaTemplateName = newName;
    metaTemplateStatus = MetaTemplateStatus.PENDING_APPROVAL;
    metaTemplateRejectionReason = null;
    metaLastSyncedAt = new Date();

    // Best-effort: se a Meta já retornou status diferente de PENDING, usamos.
    if (created.status === "APPROVED") {
      metaTemplateStatus = MetaTemplateStatus.APPROVED;
    } else if (created.status === "REJECTED") {
      metaTemplateStatus = MetaTemplateStatus.REJECTED;
    }
  }

  const updated = await db.botAutomation.update({
    where: { tenantId_type: { tenantId, type: input.type } },
    data: {
      enabled: input.enabled,
      templateText: input.templateText,
      windowDays:
        "windowDays" in input
          ? (input.windowDays ?? null)
          : (current.windowDays ?? null),
      variableMap,
      metaTemplateName,
      metaTemplateStatus,
      metaTemplateRejectionReason,
      metaLastSyncedAt,
    },
  });

  return decorate(updated);
}

export async function syncTemplateStatus(
  tenantId: string,
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType]
): Promise<BotAutomationWithDerived> {
  const current = await getOrCreateAutomation(tenantId, type);

  if (!current.metaTemplateName) {
    return current;
  }

  const credentials = await getBotCredentials(tenantId);
  if (!credentials) {
    return current;
  }

  const result = await getMessageTemplateStatus({
    wabaId: credentials.wabaId,
    accessToken: credentials.accessToken,
    apiVersion: credentials.apiVersion,
    name: current.metaTemplateName,
  });

  let nextStatus = current.metaTemplateStatus;
  let nextRejection: string | null = current.metaTemplateRejectionReason;

  if (result === null) {
    nextStatus = MetaTemplateStatus.DELETED;
    nextRejection = null;
  } else {
    switch (result.status) {
      case "APPROVED":
        nextStatus = MetaTemplateStatus.APPROVED;
        nextRejection = null;
        break;
      case "REJECTED":
        nextStatus = MetaTemplateStatus.REJECTED;
        nextRejection = result.rejectionReason ?? null;
        break;
      case "PENDING":
      case "IN_APPEAL":
      case "PENDING_DELETION":
        nextStatus = MetaTemplateStatus.PENDING_APPROVAL;
        nextRejection = null;
        break;
      case "DELETED":
      case "DISABLED":
      case "PAUSED":
        nextStatus = MetaTemplateStatus.DELETED;
        nextRejection = null;
        break;
      default:
        // Mantém status atual em caso desconhecido.
        break;
    }
  }

  if (
    nextStatus === MetaTemplateStatus.REJECTED &&
    nextRejection === "INVALID_FORMAT" &&
    current.metaTemplateName
  ) {
    try {
      await deleteMessageTemplate({
        wabaId: credentials.wabaId,
        accessToken: credentials.accessToken,
        apiVersion: credentials.apiVersion,
        name: current.metaTemplateName,
      });

      const namedParams = extractNamedParams(current.templateText);
      const created = await createMessageTemplate({
        wabaId: credentials.wabaId,
        accessToken: credentials.accessToken,
        apiVersion: credentials.apiVersion,
        name: current.metaTemplateName,
        category: current.metaCategory,
        languageCode: current.metaTemplateLanguage,
        bodyText: current.templateText,
        namedParams: namedParams.length > 0 ? namedParams : undefined,
      });

      nextStatus =
        created.status === "APPROVED"
          ? MetaTemplateStatus.APPROVED
          : created.status === "REJECTED"
            ? MetaTemplateStatus.REJECTED
            : MetaTemplateStatus.PENDING_APPROVAL;
      nextRejection = null;
    } catch (recreateError) {
      console.error(
        `[bot-automation] falha ao recriar template após INVALID_FORMAT | tenantId=${tenantId} | type=${type}`,
        recreateError
      );
    }
  }

  const updated = await db.botAutomation.update({
    where: { tenantId_type: { tenantId, type } },
    data: {
      metaTemplateStatus: nextStatus,
      metaTemplateRejectionReason: nextRejection,
      metaLastSyncedAt: new Date(),
    },
  });

  return decorate(updated);
}

type AutomationRunResult = {
  sent: number;
  failed: number;
  skipped: number;
  skippedReason?: (typeof BotAutomationSkipReason)[keyof typeof BotAutomationSkipReason];
};

function todayInSaoPauloMMDD(): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "0");
  return { month, day };
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

export async function runBirthdayAutomation(
  tenantId: string
): Promise<AutomationRunResult> {
  const automation = await getOrCreateAutomation(tenantId, BotAutomationType.BIRTHDAY);

  if (!automation.enabled) {
    return { sent: 0, failed: 0, skipped: 0, skippedReason: BotAutomationSkipReason.DISABLED };
  }
  if (automation.metaTemplateStatus !== MetaTemplateStatus.APPROVED) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      skippedReason: BotAutomationSkipReason.TEMPLATE_NOT_APPROVED,
    };
  }

  const credentials = await getBotCredentials(tenantId);
  if (!credentials || !automation.metaTemplateName) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      skippedReason: BotAutomationSkipReason.DISABLED,
    };
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) {
    return { sent: 0, failed: 0, skipped: 0, skippedReason: BotAutomationSkipReason.DISABLED };
  }

  const { month, day } = todayInSaoPauloMMDD();

  const variableMap = isValidVariableMap(automation.variableMap)
    ? automation.variableMap
    : [];

  const customers = await db.customer.findMany({
    where: {
      tenantId,
      isActive: true,
      optOutAutomations: false,
      birthDate: { not: null },
      phone: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      birthDate: true,
    },
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const customer of customers) {
    try {
      if (!customer.birthDate || !customer.phone) {
        continue;
      }
      // Comparar em UTC: birthDate é armazenada como DateTime @db.Timestamp(3)
      // e geralmente representa o dia bruto. Usamos getUTCMonth/getUTCDate
      // pra evitar shift de timezone no servidor.
      const birthMonth = customer.birthDate.getUTCMonth() + 1;
      const birthDay = customer.birthDate.getUTCDate();
      if (birthMonth !== month || birthDay !== day) {
        continue;
      }

      const existingLog = await db.botAutomationLog.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          automationType: BotAutomationType.BIRTHDAY,
          sentAt: { gte: twentyFourHoursAgo },
        },
        select: { id: true },
      });

      const values: Record<string, string> = {
        nome: firstName(customer.name),
        negocio: tenant.name,
      };
      const renderedMessage = renderPreview(automation.templateText, values);

      if (existingLog) {
        skipped += 1;
        await db.botAutomationLog.create({
          data: {
            tenantId,
            customerId: customer.id,
            automationType: BotAutomationType.BIRTHDAY,
            automationId: automation.id,
            status: BotAutomationLogStatus.SKIPPED,
            skipReason: BotAutomationSkipReason.ALREADY_SENT,
            renderedMessage,
          },
        });
        continue;
      }

      const bodyVariables = renderForMeta(variableMap, values);

      try {
        const { messageId } = await sendTemplateMessage({
          phoneNumberId: credentials.phoneNumberId,
          accessToken: credentials.accessToken,
          apiVersion: credentials.apiVersion,
          to: customer.phone,
          templateName: automation.metaTemplateName,
          languageCode: automation.metaTemplateLanguage,
          bodyVariables,
        });
        sent += 1;
        await db.botAutomationLog.create({
          data: {
            tenantId,
            customerId: customer.id,
            automationType: BotAutomationType.BIRTHDAY,
            automationId: automation.id,
            status: BotAutomationLogStatus.SENT,
            metaMessageId: messageId,
            renderedMessage,
          },
        });
      } catch (sendError) {
        failed += 1;
        const errorMessage =
          sendError instanceof Error ? sendError.message : "Erro desconhecido";
        await db.botAutomationLog.create({
          data: {
            tenantId,
            customerId: customer.id,
            automationType: BotAutomationType.BIRTHDAY,
            automationId: automation.id,
            status: BotAutomationLogStatus.FAILED,
            errorMessage,
            renderedMessage,
          },
        });
      }
    } catch (loopError) {
      failed += 1;
      console.error(
        `[bot-automation] erro processando customer ${customer.id} do tenant ${tenantId}`,
        loopError
      );
    }
  }

  return { sent, failed, skipped };
}

type RunnablePrereqs = {
  automation: BotAutomationWithDerived;
  credentials: Awaited<ReturnType<typeof getBotCredentials>>;
  tenantName: string;
  variableMap: VariableMapEntry[];
};

async function loadRunnablePrereqs(
  tenantId: string,
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType]
): Promise<
  | { ok: true; prereqs: RunnablePrereqs }
  | { ok: false; result: AutomationRunResult }
> {
  const automation = await getOrCreateAutomation(tenantId, type);

  if (!automation.enabled) {
    return {
      ok: false,
      result: {
        sent: 0,
        failed: 0,
        skipped: 0,
        skippedReason: BotAutomationSkipReason.DISABLED,
      },
    };
  }
  if (automation.metaTemplateStatus !== MetaTemplateStatus.APPROVED) {
    return {
      ok: false,
      result: {
        sent: 0,
        failed: 0,
        skipped: 0,
        skippedReason: BotAutomationSkipReason.TEMPLATE_NOT_APPROVED,
      },
    };
  }

  const credentials = await getBotCredentials(tenantId);
  if (!credentials || !automation.metaTemplateName) {
    return {
      ok: false,
      result: {
        sent: 0,
        failed: 0,
        skipped: 0,
        skippedReason: BotAutomationSkipReason.DISABLED,
      },
    };
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) {
    return {
      ok: false,
      result: {
        sent: 0,
        failed: 0,
        skipped: 0,
        skippedReason: BotAutomationSkipReason.DISABLED,
      },
    };
  }

  const variableMap = isValidVariableMap(automation.variableMap)
    ? automation.variableMap
    : [];

  return {
    ok: true,
    prereqs: { automation, credentials, tenantName: tenant.name, variableMap },
  };
}

async function dispatchAndLog(params: {
  tenantId: string;
  prereqs: RunnablePrereqs;
  customerId: string;
  customerPhone: string;
  values: Record<string, string>;
  appointmentId?: string;
}): Promise<"sent" | "failed"> {
  const { tenantId, prereqs, customerId, customerPhone, values, appointmentId } =
    params;
  const { automation, credentials, variableMap } = prereqs;

  if (!automation.metaTemplateName) {
    return "failed";
  }

  const renderedMessage = renderPreview(automation.templateText, values);
  const bodyVariables = renderForMeta(variableMap, values);

  try {
    const { messageId } = await sendTemplateMessage({
      phoneNumberId: credentials!.phoneNumberId,
      accessToken: credentials!.accessToken,
      apiVersion: credentials!.apiVersion,
      to: customerPhone,
      templateName: automation.metaTemplateName,
      languageCode: automation.metaTemplateLanguage,
      bodyVariables,
    });
    await db.botAutomationLog.create({
      data: {
        tenantId,
        customerId,
        automationType: automation.type,
        automationId: automation.id,
        appointmentId: appointmentId ?? null,
        status: BotAutomationLogStatus.SENT,
        metaMessageId: messageId,
        renderedMessage,
      },
    });
    return "sent";
  } catch (sendError) {
    const errorMessage =
      sendError instanceof Error ? sendError.message : "Erro desconhecido";
    await db.botAutomationLog.create({
      data: {
        tenantId,
        customerId,
        automationType: automation.type,
        automationId: automation.id,
        appointmentId: appointmentId ?? null,
        status: BotAutomationLogStatus.FAILED,
        errorMessage,
        renderedMessage,
      },
    });
    return "failed";
  }
}

export async function runInactiveAutomation(
  tenantId: string
): Promise<AutomationRunResult> {
  const pre = await loadRunnablePrereqs(tenantId, BotAutomationType.INACTIVE);
  if (!pre.ok) return pre.result;

  const { automation } = pre.prereqs;
  const windowDays = automation.windowDays ?? DEFAULT_WINDOW_DAYS.INACTIVE ?? 60;
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const dedupSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const eligibleStatuses = [AppointmentStatus.COMPLETED, AppointmentStatus.PAID];

  const lastVisits = await db.appointment.groupBy({
    by: ["customerId"],
    where: {
      tenantId,
      status: { in: eligibleStatuses },
    },
    _max: { startTime: true },
  });

  const customerIdsCutoff = lastVisits
    .filter(
      (row) => row._max.startTime !== null && row._max.startTime < cutoff
    )
    .map((row) => row.customerId);

  if (customerIdsCutoff.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const customers = await db.customer.findMany({
    where: {
      id: { in: customerIdsCutoff },
      tenantId,
      isActive: true,
      optOutAutomations: false,
      phone: { not: null },
    },
    select: { id: true, name: true, phone: true },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const customer of customers) {
    try {
      if (!customer.phone) continue;

      const alreadySent = await db.botAutomationLog.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          automationType: BotAutomationType.INACTIVE,
          status: BotAutomationLogStatus.SENT,
          sentAt: { gte: dedupSince },
        },
        select: { id: true },
      });
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const lastAppointment = await db.appointment.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          status: { in: eligibleStatuses },
        },
        orderBy: { startTime: "desc" },
        select: {
          services: {
            take: 1,
            include: { service: { select: { name: true } } },
          },
        },
      });

      const ultimoServico =
        lastAppointment?.services[0]?.service?.name ?? null;
      if (!ultimoServico) {
        continue;
      }

      const values: Record<string, string> = {
        nome: firstName(customer.name),
        negocio: pre.prereqs.tenantName,
        ultimo_servico: ultimoServico,
      };
      const outcome = await dispatchAndLog({
        tenantId,
        prereqs: pre.prereqs,
        customerId: customer.id,
        customerPhone: customer.phone,
        values,
      });
      if (outcome === "sent") sent += 1;
      else failed += 1;
    } catch (loopError) {
      failed += 1;
      console.error(
        `[bot-automation][INACTIVE] erro processando customer ${customer.id} do tenant ${tenantId}`,
        loopError
      );
    }
  }

  return { sent, failed, skipped };
}

export async function runPostAppointmentAutomation(
  tenantId: string
): Promise<AutomationRunResult> {
  const pre = await loadRunnablePrereqs(
    tenantId,
    BotAutomationType.POST_APPOINTMENT
  );
  if (!pre.ok) return pre.result;

  const now = Date.now();
  const windowStart = new Date(now - 25 * 60 * 60 * 1000);
  const windowEnd = new Date(now - 23 * 60 * 60 * 1000);

  const appointments = await db.appointment.findMany({
    where: {
      tenantId,
      status: {
        in: [AppointmentStatus.COMPLETED, AppointmentStatus.PAID],
      },
      endTime: { gte: windowStart, lte: windowEnd },
      customer: {
        optOutAutomations: false,
        phone: { not: null },
      },
    },
    select: {
      id: true,
      customerId: true,
      customer: {
        select: { id: true, name: true, phone: true },
      },
      professional: {
        select: { user: { select: { name: true } } },
      },
      services: {
        take: 1,
        include: { service: { select: { name: true } } },
      },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const appointment of appointments) {
    try {
      const customer = appointment.customer;
      if (!customer || !customer.phone) continue;

      const alreadySent = await db.botAutomationLog.findFirst({
        where: {
          tenantId,
          automationType: BotAutomationType.POST_APPOINTMENT,
          appointmentId: appointment.id,
          status: BotAutomationLogStatus.SENT,
        },
        select: { id: true },
      });
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const servico = appointment.services[0]?.service?.name ?? null;
      const profissionalNome = appointment.professional?.user?.name
        ? firstName(appointment.professional.user.name)
        : null;
      if (!servico || !profissionalNome) {
        continue;
      }

      const values: Record<string, string> = {
        nome: firstName(customer.name),
        negocio: pre.prereqs.tenantName,
        servico,
        profissional: profissionalNome,
      };
      const outcome = await dispatchAndLog({
        tenantId,
        prereqs: pre.prereqs,
        customerId: customer.id,
        customerPhone: customer.phone,
        values,
        appointmentId: appointment.id,
      });
      if (outcome === "sent") sent += 1;
      else failed += 1;
    } catch (loopError) {
      failed += 1;
      console.error(
        `[bot-automation][POST_APPOINTMENT] erro processando appointment ${appointment.id} do tenant ${tenantId}`,
        loopError
      );
    }
  }

  return { sent, failed, skipped };
}

export async function runRescheduleAutomation(
  tenantId: string
): Promise<AutomationRunResult> {
  const pre = await loadRunnablePrereqs(
    tenantId,
    BotAutomationType.RESCHEDULE
  );
  if (!pre.ok) return pre.result;

  const now = Date.now();
  const windowStart = new Date(now - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now - 2 * 60 * 60 * 1000);

  const appointments = await db.appointment.findMany({
    where: {
      tenantId,
      status: {
        in: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
      updatedAt: { gte: windowStart, lte: windowEnd },
      customer: {
        optOutAutomations: false,
        phone: { not: null },
      },
    },
    select: {
      id: true,
      startTime: true,
      customerId: true,
      customer: {
        select: { id: true, name: true, phone: true },
      },
      services: {
        take: 1,
        include: { service: { select: { name: true } } },
      },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const appointment of appointments) {
    try {
      const customer = appointment.customer;
      if (!customer || !customer.phone) continue;

      const alreadySent = await db.botAutomationLog.findFirst({
        where: {
          tenantId,
          automationType: BotAutomationType.RESCHEDULE,
          appointmentId: appointment.id,
          status: BotAutomationLogStatus.SENT,
        },
        select: { id: true },
      });
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const servico = appointment.services[0]?.service?.name ?? null;
      if (!servico) {
        continue;
      }

      const dataOriginal = format(appointment.startTime, "d 'de' MMMM", {
        locale: ptBR,
      });

      const values: Record<string, string> = {
        nome: firstName(customer.name),
        negocio: pre.prereqs.tenantName,
        servico,
        data_original: dataOriginal,
      };
      const outcome = await dispatchAndLog({
        tenantId,
        prereqs: pre.prereqs,
        customerId: customer.id,
        customerPhone: customer.phone,
        values,
        appointmentId: appointment.id,
      });
      if (outcome === "sent") sent += 1;
      else failed += 1;
    } catch (loopError) {
      failed += 1;
      console.error(
        `[bot-automation][RESCHEDULE] erro processando appointment ${appointment.id} do tenant ${tenantId}`,
        loopError
      );
    }
  }

  return { sent, failed, skipped };
}

export async function runAllAutomationsForTenant(
  tenantId: string
): Promise<{
  birthday: AutomationRunResult;
  inactive: AutomationRunResult;
  postAppointment: AutomationRunResult;
  reschedule: AutomationRunResult;
}> {
  const results = await Promise.allSettled([
    runBirthdayAutomation(tenantId),
    runInactiveAutomation(tenantId),
    runPostAppointmentAutomation(tenantId),
    runRescheduleAutomation(tenantId),
  ]);

  function unwrap(
    r: PromiseSettledResult<AutomationRunResult>,
    label: string
  ): AutomationRunResult {
    if (r.status === "fulfilled") return r.value;
    console.error(
      `[bot-automation] runAllAutomationsForTenant ${label} rejected for tenant ${tenantId}`,
      r.reason
    );
    return { sent: 0, failed: 0, skipped: 0 };
  }

  return {
    birthday: unwrap(results[0], "BIRTHDAY"),
    inactive: unwrap(results[1], "INACTIVE"),
    postAppointment: unwrap(results[2], "POST_APPOINTMENT"),
    reschedule: unwrap(results[3], "RESCHEDULE"),
  };
}

export async function sendAutomationTest(
  tenantId: string,
  type: (typeof BotAutomationType)[keyof typeof BotAutomationType],
  to: string,
  overrideValues?: Record<string, string>
): Promise<{ messageId: string }> {
  const automation = await getOrCreateAutomation(tenantId, type);
  if (automation.metaTemplateStatus !== MetaTemplateStatus.APPROVED) {
    throw new Error("Só é possível testar automações com template aprovado pela Meta.");
  }
  if (!automation.metaTemplateName) {
    throw new Error("Automação sem template cadastrado na Meta.");
  }
  const credentials = await getBotCredentials(tenantId);
  if (!credentials) {
    throw new Error("Configure o WhatsApp antes de disparar testes.");
  }
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  const defaults: Record<string, string> = {
    nome: "Maria",
    negocio: tenant.name,
    ultimo_servico: "Limpeza de pele",
    servico: "Corte de cabelo",
    profissional: "Julia",
    data_original: "amanhã às 15h",
  };
  const values = { ...defaults, ...(overrideValues ?? {}) };

  const variableMap = isValidVariableMap(automation.variableMap)
    ? automation.variableMap
    : [];
  const bodyVariables = renderForMeta(variableMap, values);

  const { messageId } = await sendTemplateMessage({
    phoneNumberId: credentials.phoneNumberId,
    accessToken: credentials.accessToken,
    apiVersion: credentials.apiVersion,
    to,
    templateName: automation.metaTemplateName,
    languageCode: automation.metaTemplateLanguage,
    bodyVariables,
  });

  return { messageId };
}
