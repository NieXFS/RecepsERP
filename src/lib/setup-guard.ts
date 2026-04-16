import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export type TenantSetupState = {
  isSetupPending: boolean;
  setupCompletedAt: Date | null;
  setupSkippedAt: Date | null;
};

/**
 * Lê o estado do setup inicial do tenant.
 * "Pendente" = nunca foi concluído nem pulado.
 */
export async function getTenantSetupState(tenantId: string): Promise<TenantSetupState> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      setupCompletedAt: true,
      setupSkippedAt: true,
    },
  });

  const setupCompletedAt = tenant?.setupCompletedAt ?? null;
  const setupSkippedAt = tenant?.setupSkippedAt ?? null;

  return {
    isSetupPending: !setupCompletedAt && !setupSkippedAt,
    setupCompletedAt,
    setupSkippedAt,
  };
}

/**
 * Usado pelo layout do dashboard pra chutar o usuário pro wizard
 * antes mesmo de carregar a sidebar/header. Só considera "pendente"
 * se NÃO foi concluído e NÃO foi pulado.
 *
 * `currentPathname` evita o loop de redirect caso o próprio /bem-vindo
 * use este helper por engano no futuro.
 */
export async function enforceSetupCompleted(
  tenantId: string,
  currentPathname: string
): Promise<void> {
  if (currentPathname.startsWith("/bem-vindo")) {
    return;
  }

  const state = await getTenantSetupState(tenantId);
  if (state.isSetupPending) {
    redirect("/bem-vindo");
  }
}
