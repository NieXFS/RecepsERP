"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { TenantBusinessSegment } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { buildAppEventUrl, trackServerEvent } from "@/lib/analytics/server-events";
import { getAuthUser } from "@/lib/session";
import {
  setupStepBusinessHoursSchema,
  setupStepProfessionalSchema,
  setupStepSegmentSchema,
  type SetupStepBusinessHoursInput,
  type SetupStepProfessionalInput,
  type SetupStepSegmentInput,
} from "@/lib/validators/setup";
import type { ActionResult } from "@/types";

/**
 * Server Actions do fluxo de setup inicial (/bem-vindo).
 *
 * Cada passo é independente e idempotente: o usuário pode voltar, sair
 * e voltar depois — o wizard retoma de onde parou olhando o estado
 * do próprio tenant (serviços cadastrados, profissional vinculado,
 * horário customizado).
 */

function revalidateSetupAndDashboard() {
  revalidatePath("/bem-vindo");
  revalidatePath("/dashboard");
  revalidatePath("/servicos");
  revalidatePath("/profissionais");
  revalidatePath("/configuracoes/negocio");
}

export async function saveSetupSegmentAndServicesAction(
  input: SetupStepSegmentInput
): Promise<ActionResult<{ servicesCreated: number }>> {
  const user = await getAuthUser();

  const parsed = setupStepSegmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revise os serviços informados.",
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: user.tenantId },
        data: { businessSegment: parsed.data.segment as TenantBusinessSegment },
      });

      // Cria apenas os serviços novos (o usuário pode ter cadastrado algo fora do wizard antes).
      const existingNames = new Set(
        (
          await tx.service.findMany({
            where: { tenantId: user.tenantId, deletedAt: null },
            select: { name: true },
          })
        ).map((s) => s.name.trim().toLowerCase())
      );

      const toCreate = parsed.data.services.filter(
        (s) => !existingNames.has(s.name.trim().toLowerCase())
      );

      if (toCreate.length > 0) {
        await tx.service.createMany({
          data: toCreate.map((s) => ({
            tenantId: user.tenantId,
            name: s.name.trim(),
            description: s.description?.trim() || null,
            durationMinutes: s.durationMinutes,
            price: new Prisma.Decimal(s.price),
          })),
        });
      }

      return {
        createdCount: toCreate.length,
        isFirstServiceCreation: existingNames.size === 0 && toCreate.length > 0,
      };
    });

    if (result.isFirstServiceCreation) {
      await trackServerEvent({
        eventName: "first_service_created",
        tenantId: user.tenantId,
        eventSourceUrl: buildAppEventUrl("/bem-vindo"),
        customData: {
          segment: parsed.data.segment,
        },
      });
    }

    revalidateSetupAndDashboard();
    return { success: true, data: { servicesCreated: result.createdCount } };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar os serviços. Tente novamente.";
    return { success: false, error: message };
  }
}

export async function saveSetupProfessionalAction(
  input: SetupStepProfessionalInput
): Promise<ActionResult<{ professionalId: string }>> {
  const user = await getAuthUser();

  const parsed = setupStepProfessionalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revise os dados do profissional.",
    };
  }

  try {
    // O wizard transforma o usuário admin logado no primeiro profissional.
    // Depois ele pode cadastrar outros membros da equipe em /profissionais.
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.professional.findUnique({
        where: { userId: user.id },
      });

      const data = {
        tenantId: user.tenantId,
        userId: user.id,
        specialty: parsed.data.specialty.trim(),
        registrationNumber:
          parsed.data.registrationNumber?.trim() || null,
        commissionPercent: new Prisma.Decimal(parsed.data.commissionPercent),
        isActive: true,
      };

      if (existing) {
        const updated = await tx.professional.update({
          where: { id: existing.id },
          data: {
            specialty: data.specialty,
            registrationNumber: data.registrationNumber,
            commissionPercent: data.commissionPercent,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });
        return updated.id;
      }

      const created = await tx.professional.create({
        data,
        select: { id: true },
      });
      return created.id;
    });

    revalidateSetupAndDashboard();
    return { success: true, data: { professionalId: result } };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar o profissional. Tente novamente.";
    return { success: false, error: message };
  }
}

export async function saveSetupBusinessHoursAction(
  input: SetupStepBusinessHoursInput
): Promise<ActionResult> {
  const user = await getAuthUser();

  const parsed = setupStepBusinessHoursSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Revise o horário informado.",
    };
  }

  try {
    await db.tenant.update({
      where: { id: user.tenantId },
      data: {
        openingTime: parsed.data.openingTime,
        closingTime: parsed.data.closingTime,
        slotIntervalMinutes: parsed.data.slotIntervalMinutes,
      },
    });

    revalidateSetupAndDashboard();
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar o horário. Tente novamente.";
    return { success: false, error: message };
  }
}

/**
 * Marca o setup do tenant como concluído. NÃO mexe em `lifecycleStatus`:
 * esse estado é gerenciado pelo fluxo de billing/admin (ACTIVE/SUSPENDED).
 * A flag que decide se o wizard ainda aparece é `setupCompletedAt`
 * (ou `setupSkippedAt`).
 */
export async function completeSetupAction(): Promise<ActionResult> {
  const user = await getAuthUser();

  try {
    await db.tenant.update({
      where: { id: user.tenantId },
      data: { setupCompletedAt: new Date() },
    });

    revalidateSetupAndDashboard();
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível concluir o setup.";
    return { success: false, error: message };
  }
}

/**
 * Marca o setup como pulado. Mesmo comportamento: apenas timestamp,
 * sem mexer em lifecycleStatus do tenant.
 */
export async function skipSetupAction(): Promise<ActionResult> {
  const user = await getAuthUser();

  try {
    await db.tenant.update({
      where: { id: user.tenantId },
      data: { setupSkippedAt: new Date() },
    });

    revalidateSetupAndDashboard();
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível pular o setup.";
    return { success: false, error: message };
  }
}
