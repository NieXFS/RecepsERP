import type { Role, TenantModule } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getModulesForPlanSlug } from "@/lib/plan-modules";
import { normalizePlanSlug } from "@/lib/plans";
import type { ModuleAccessMap } from "@/lib/tenant-modules";
import { getModuleAccessMap, type TenantCustomPermissions } from "@/lib/tenant-permissions";
import { getEffectivePermissionSnapshot } from "@/services/user-permission.service";

export type ModuleAccessReason =
  | { granted: true }
  | { granted: false; reason: "plan-locked" }
  | { granted: false; reason: "permission-denied" }
  | { granted: false; reason: "module-disabled" };

type ModuleAccessUser = {
  id?: string;
  tenantId: string;
  role: Role;
  moduleAccess?: ModuleAccessMap;
  allowedModules?: readonly TenantModule[];
  customPermissions?: TenantCustomPermissions;
};

export function getPlanModulesForTenant(input: {
  billingBypassEnabled?: boolean | null;
  planSlug?: string | null;
}): TenantModule[] {
  if (input.billingBypassEnabled) {
    return getModulesForPlanSlug(null);
  }

  return getModulesForPlanSlug(
    normalizePlanSlug(input.planSlug ?? null) ?? input.planSlug ?? null
  );
}

export function resolveModuleAccessForPlan(
  user: ModuleAccessUser,
  planModules: readonly TenantModule[],
  module: TenantModule
): ModuleAccessReason {
  if (!planModules.includes(module)) {
    return { granted: false, reason: "plan-locked" };
  }

  const granted =
    user.moduleAccess?.[module] ??
    user.allowedModules?.includes(module) ??
    (user.customPermissions ? getModuleAccessMap(user.customPermissions)[module] : false);

  return granted ? { granted: true } : { granted: false, reason: "permission-denied" };
}

export async function getModuleAccess(
  user: ModuleAccessUser,
  tenantId: string,
  module: TenantModule
): Promise<ModuleAccessReason> {
  if (user.tenantId !== tenantId) {
    return { granted: false, reason: "module-disabled" };
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      billingBypassEnabled: true,
      subscription: {
        select: {
          plan: {
            select: { slug: true },
          },
        },
      },
    },
  });

  if (!tenant) {
    return { granted: false, reason: "module-disabled" };
  }

  const planModules = getPlanModulesForTenant({
    billingBypassEnabled: tenant.billingBypassEnabled,
    planSlug: tenant.subscription?.plan?.slug ?? null,
  });

  if (!planModules.includes(module)) {
    return { granted: false, reason: "plan-locked" };
  }

  if (user.moduleAccess || user.allowedModules || user.customPermissions) {
    return resolveModuleAccessForPlan(user, planModules, module);
  }

  if (!user.id) {
    return { granted: false, reason: "permission-denied" };
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
      tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      role: true,
      customPermissions: true,
      modulePermissions: {
        select: {
          module: true,
          isAllowed: true,
        },
      },
    },
  });

  if (!dbUser) {
    return { granted: false, reason: "permission-denied" };
  }

  const snapshot = getEffectivePermissionSnapshot(
    dbUser.role,
    dbUser.customPermissions,
    dbUser.modulePermissions
  );

  return resolveModuleAccessForPlan(
    {
      ...user,
      role: dbUser.role,
      customPermissions: snapshot.customPermissions,
      moduleAccess: snapshot.moduleAccess,
      allowedModules: snapshot.allowedModules,
    },
    planModules,
    module
  );
}
