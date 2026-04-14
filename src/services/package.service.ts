import { db } from "@/lib/db";
import type { ActionResult } from "@/types";
import type { PackageInput } from "@/lib/validators/management";

async function validatePackageServices(tenantId: string, services: PackageInput["services"]) {
  const uniqueServiceIds = [...new Set(services.map((service) => service.serviceId))];

  if (uniqueServiceIds.length !== services.length) {
    return { success: false as const, error: "Não repita o mesmo serviço dentro do pacote." };
  }

  const existingServices = await db.service.findMany({
    where: {
      tenantId,
      id: { in: uniqueServiceIds },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existingServices.length !== uniqueServiceIds.length) {
    return { success: false as const, error: "Um ou mais serviços selecionados não pertencem a este tenant." };
  }

  return { success: true as const };
}

/**
 * Lista o catálogo de pacotes com serviços vinculados e volume de vendas já realizadas.
 */
export async function listPackagesWithDetails(tenantId: string) {
  const packages = await db.package.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    include: {
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          customerPackages: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    totalSessions: pkg.totalSessions,
    price: Number(pkg.price),
    validityDays: pkg.validityDays,
    isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(),
    soldCount: pkg._count.customerPackages,
    services: pkg.services.map((packageService) => ({
      id: packageService.id,
      serviceId: packageService.serviceId,
      serviceName: packageService.service.name,
      quantity: packageService.quantity,
    })),
  }));
}

/**
 * Lista serviços disponíveis para compor pacotes no tenant autenticado.
 */
export async function listServicesForPackageSelect(tenantId: string) {
  return db.service.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Cria um novo pacote comercial preservando isolamento por tenant e vínculo com serviços.
 */
export async function createPackage(
  tenantId: string,
  data: PackageInput
): Promise<ActionResult<{ packageId: string }>> {
  const validation = await validatePackageServices(tenantId, data.services);
  if (!validation.success) {
    return validation;
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description ?? null,
          totalSessions: data.totalSessions,
          price: data.price,
          validityDays: data.validityDays ?? null,
          isActive: data.isActive,
        },
      });

      await tx.packageService.createMany({
        data: data.services.map((service) => ({
          packageId: pkg.id,
          serviceId: service.serviceId,
          quantity: service.quantity,
        })),
      });

      return { packageId: pkg.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar pacote.";
    return { success: false, error: message };
  }
}

/**
 * Atualiza um pacote existente mantendo o mesmo Package.id e recriando apenas os vínculos internos.
 */
export async function updatePackage(
  tenantId: string,
  packageId: string,
  data: PackageInput
): Promise<ActionResult<{ packageId: string }>> {
  const [existingPackage, validation] = await Promise.all([
    db.package.findFirst({
      where: {
        id: packageId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    }),
    validatePackageServices(tenantId, data.services),
  ]);

  if (!existingPackage) {
    return { success: false, error: "Pacote não encontrado." };
  }

  if (!validation.success) {
    return validation;
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.package.update({
        where: { id: packageId },
        data: {
          name: data.name,
          description: data.description ?? null,
          totalSessions: data.totalSessions,
          price: data.price,
          validityDays: data.validityDays ?? null,
          isActive: data.isActive,
        },
      });

      await tx.packageService.deleteMany({
        where: { packageId },
      });

      await tx.packageService.createMany({
        data: data.services.map((service) => ({
          packageId,
          serviceId: service.serviceId,
          quantity: service.quantity,
        })),
      });
    });

    return { success: true, data: { packageId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pacote.";
    return { success: false, error: message };
  }
}
