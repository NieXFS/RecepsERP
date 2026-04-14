import type { Prisma } from "@/generated/prisma/client";
import {
  getModulePermissionOverrides,
  resolveEffectivePermissionSnapshot,
  type TenantCustomPermissions,
} from "@/lib/tenant-permissions";

type PrismaTransaction = Prisma.TransactionClient;

type RoleValue = Prisma.UserGetPayload<{ select: { role: true } }>["role"];

type ModulePermissionOverride = Prisma.UserModulePermissionGetPayload<{
  select: {
    module: true;
    isAllowed: true;
  };
}>;

/**
 * Persiste os overrides legados por módulo para manter compatibilidade
 * com a modelagem anterior durante a transição para o JSON granular.
 */
export async function replaceUserModulePermissions(
  tx: PrismaTransaction,
  userId: string,
  role: RoleValue,
  customPermissions: TenantCustomPermissions
) {
  const overrides = getModulePermissionOverrides(role, customPermissions);

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
 * Resolve a fotografia efetiva de acesso do usuário. O JSON granular
 * é a fonte de verdade; os overrides legados viram fallback quando ele ainda não existe.
 */
export function getEffectivePermissionSnapshot(
  role: RoleValue,
  customPermissions: unknown,
  modulePermissions: readonly ModulePermissionOverride[]
) {
  return resolveEffectivePermissionSnapshot(role, customPermissions, modulePermissions);
}
