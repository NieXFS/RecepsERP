import type { Prisma } from "@/generated/prisma/client";
import type { Role, TenantModule } from "@/generated/prisma/enums";
import {
  getDefaultModuleAccess,
  listAllowedModules,
  resolveEffectiveModuleAccess,
} from "@/lib/tenant-modules";

type PrismaTransaction = Prisma.TransactionClient;

type ModulePermissionOverride = {
  module: TenantModule;
  isAllowed: boolean;
};

/**
 * Converte a lista efetiva de permissões enviada pelo formulário
 * em overrides persistidos contra o padrão do cargo.
 */
export function getModulePermissionOverrides(
  role: Role,
  modulePermissions: readonly ModulePermissionOverride[]
): ModulePermissionOverride[] {
  const defaults = getDefaultModuleAccess(role);

  return modulePermissions.filter(
    (permission) => defaults[permission.module] !== permission.isAllowed
  );
}

/**
 * Persiste as permissões customizadas do usuário.
 * Apenas as diferenças em relação ao cargo-base são salvas em banco.
 */
export async function replaceUserModulePermissions(
  tx: PrismaTransaction,
  userId: string,
  role: Role,
  modulePermissions: readonly ModulePermissionOverride[]
) {
  const overrides = getModulePermissionOverrides(role, modulePermissions);

  await tx.userModulePermission.deleteMany({
    where: { userId },
  });

  if (overrides.length > 0) {
    await tx.userModulePermission.createMany({
      data: overrides.map((permission) => ({
        userId,
        module: permission.module,
        isAllowed: permission.isAllowed,
      })),
    });
  }
}

/**
 * Resolve o mapa efetivo de permissões a partir do cargo-base e dos overrides.
 */
export function getEffectiveModuleAccessSnapshot(
  role: Role,
  modulePermissions: readonly ModulePermissionOverride[]
) {
  const access = resolveEffectiveModuleAccess(role, modulePermissions);

  return {
    access,
    allowedModules: listAllowedModules(access),
  };
}
