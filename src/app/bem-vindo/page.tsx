import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthUserWithAccess } from "@/lib/session";
import { SetupWizard, type SetupWizardInitialState } from "@/components/setup/setup-wizard";
import { getTenantSetupState } from "@/lib/setup-guard";
import { normalizePlanSlug, PLAN_SLUGS } from "@/lib/plans";

/**
 * Fluxo de setup inicial (/bem-vindo).
 *
 * Entry point do novo tenant logo após o signup. Ele vai ler o que já
 * foi configurado (pra permitir retomar de onde o usuário parou) e
 * montar o wizard. Se o tenant já concluiu ou pulou o setup, manda
 * direto pro dashboard.
 */
export default async function WelcomePage() {
  const user = await getAuthUserWithAccess();
  const state = await getTenantSetupState(user.tenantId);

  // Já passou pelo fluxo em outro momento: manda pro dashboard.
  if (!state.isSetupPending) {
    redirect("/dashboard");
  }

  const [tenant, servicesCount, professional, subscription] = await Promise.all([
    db.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        businessSegment: true,
        openingTime: true,
        closingTime: true,
        slotIntervalMinutes: true,
      },
    }),
    db.service.count({
      where: { tenantId: user.tenantId, deletedAt: null },
    }),
    db.professional.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        specialty: true,
        registrationNumber: true,
        commissionPercent: true,
      },
    }),
    db.subscription.findUnique({
      where: { tenantId: user.tenantId },
      select: { plan: { select: { slug: true } } },
    }),
  ]);

  if (!tenant) {
    // Estado improvável (tenant deletado no meio do fluxo) — volta pro login.
    redirect("/logout");
  }

  const planSlug =
    normalizePlanSlug(subscription?.plan?.slug) ?? subscription?.plan?.slug ?? null;
  const hasWhatsAppProduct =
    planSlug === PLAN_SLUGS.ATENDENTE_IA || planSlug === PLAN_SLUGS.COMBO;

  const initialState: SetupWizardInitialState = {
    tenantName: tenant.name,
    userName: user.name,
    segment: tenant.businessSegment,
    hasServices: servicesCount > 0,
    professional: professional
      ? {
          specialty: professional.specialty ?? "",
          registrationNumber: professional.registrationNumber ?? "",
          commissionPercent: Number(professional.commissionPercent ?? 0),
        }
      : null,
    businessHours: {
      openingTime: tenant.openingTime,
      closingTime: tenant.closingTime,
      slotIntervalMinutes: tenant.slotIntervalMinutes,
    },
    hasWhatsAppProduct,
    planSlug,
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
      <SetupWizard initialState={initialState} />
    </main>
  );
}
