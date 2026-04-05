import { db } from "@/lib/db";
import type { ActionResult } from "@/types";

/**
 * Lista serviços do tenant com ficha técnica e profissionais vinculados.
 * Usado na tela de catálogo de serviços para exibir a configuração completa.
 */
export async function listServicesWithDetails(tenantId: string) {
  const services = await db.service.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    include: {
      materials: {
        include: { product: { select: { id: true, name: true, unit: true } } },
      },
      professionals: {
        include: {
          professional: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    materials: s.materials.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      productUnit: m.product.unit,
      quantity: Number(m.quantity),
    })),
    professionals: s.professionals.map((ps) => ({
      id: ps.id,
      professionalId: ps.professionalId,
      professionalName: ps.professional.user.name,
      customCommissionPercent: ps.customCommissionPercent
        ? Number(ps.customCommissionPercent)
        : null,
    })),
  }));
}

/**
 * Lista produtos ativos (para select de ficha técnica).
 */
export async function listProductsForSelect(tenantId: string) {
  const products = await db.product.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    select: { id: true, name: true, unit: true, type: true },
    orderBy: { name: "asc" },
  });
  return products;
}

/**
 * Lista profissionais ativos (para select de vínculo com serviço).
 */
export async function listProfessionalsForSelect(tenantId: string) {
  const profs = await db.professional.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return profs.map((p) => ({
    id: p.id,
    name: p.user.name,
    commissionPercent: Number(p.commissionPercent),
  }));
}

type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  materials: { productId: string; quantity: number }[];
  professionals: { professionalId: string; customCommissionPercent?: number }[];
};

/**
 * Cria um novo serviço com ficha técnica e profissionais vinculados.
 * Tudo em transação ACID: se a ficha técnica falhar, o serviço não é criado.
 */
export async function createService(
  tenantId: string,
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Cria o serviço
      const service = await tx.service.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description ?? null,
          durationMinutes: data.durationMinutes,
          price: data.price,
        },
      });

      // Cria a ficha técnica (ServiceMaterial)
      if (data.materials.length > 0) {
        await tx.serviceMaterial.createMany({
          data: data.materials.map((m) => ({
            tenantId,
            serviceId: service.id,
            productId: m.productId,
            quantity: m.quantity,
          })),
        });
      }

      // Vincula profissionais aptos (ProfessionalService)
      if (data.professionals.length > 0) {
        await tx.professionalService.createMany({
          data: data.professionals.map((p) => ({
            professionalId: p.professionalId,
            serviceId: service.id,
            customCommissionPercent: p.customCommissionPercent ?? null,
          })),
        });
      }

      return { serviceId: service.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar serviço.";
    return { success: false, error: message };
  }
}

/**
 * Atualiza um serviço existente incluindo ficha técnica e profissionais.
 * Estratégia: deleta vínculos antigos e recria com os novos dados (replace).
 * Tudo em transação ACID.
 */
export async function updateService(
  tenantId: string,
  serviceId: string,
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const existing = await db.service.findFirst({
    where: { id: serviceId, tenantId, deletedAt: null },
  });

  if (!existing) {
    return { success: false, error: "Serviço não encontrado." };
  }

  try {
    await db.$transaction(async (tx) => {
      // Atualiza dados básicos
      await tx.service.update({
        where: { id: serviceId },
        data: {
          name: data.name,
          description: data.description ?? null,
          durationMinutes: data.durationMinutes,
          price: data.price,
        },
      });

      // Recria ficha técnica (delete + create)
      await tx.serviceMaterial.deleteMany({
        where: { serviceId, tenantId },
      });

      if (data.materials.length > 0) {
        await tx.serviceMaterial.createMany({
          data: data.materials.map((m) => ({
            tenantId,
            serviceId,
            productId: m.productId,
            quantity: m.quantity,
          })),
        });
      }

      // Recria profissionais vinculados (delete + create)
      await tx.professionalService.deleteMany({
        where: { serviceId },
      });

      if (data.professionals.length > 0) {
        await tx.professionalService.createMany({
          data: data.professionals.map((p) => ({
            professionalId: p.professionalId,
            serviceId,
            customCommissionPercent: p.customCommissionPercent ?? null,
          })),
        });
      }
    });

    return { success: true, data: { serviceId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar serviço.";
    return { success: false, error: message };
  }
}

/**
 * Desativa (soft delete) um serviço.
 */
export async function deactivateService(
  tenantId: string,
  serviceId: string
): Promise<ActionResult> {
  const existing = await db.service.findFirst({
    where: { id: serviceId, tenantId, deletedAt: null },
  });

  if (!existing) {
    return { success: false, error: "Serviço não encontrado." };
  }

  await db.service.update({
    where: { id: serviceId },
    data: { isActive: false, deletedAt: new Date() },
  });

  return { success: true, data: undefined };
}
