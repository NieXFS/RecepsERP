import { redirect } from "next/navigation";
import { AnaStudio } from "@/components/atendente-ia/ana-studio";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { db } from "@/lib/db";
import { getAuthUserWithAccess, getTenantPlanSlug } from "@/lib/session";
import { hasPlanProduct } from "@/lib/plan-modules";
import { getBotConfigByTenantId } from "@/services/bot-config.service";
import { getAutomationsVMForTenant } from "@/services/bot-automation.service";

export default async function AtendenteIAPage() {
  const user = await getAuthUserWithAccess();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const planSlug = await getTenantPlanSlug(user.tenantId);
  if (!hasPlanProduct(planSlug, "bot")) {
    return <ModuleUpsell product="bot" />;
  }

  const [settings, automations, tenant] = await Promise.all([
    getBotConfigByTenantId(user.tenantId),
    getAutomationsVMForTenant(user.tenantId),
    db.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true },
    }),
  ]);

  const studioKey = [
    settings.botName,
    settings.greetingMessage ?? "",
    settings.fallbackMessage ?? "",
    settings.botIsAlwaysActive ? "1" : "0",
    settings.botActiveStart,
    settings.botActiveEnd,
    settings.timezone,
  ].join("|");

  return (
    <AnaStudio
      key={studioKey}
      settings={settings}
      automations={automations}
      tenantName={tenant?.name ?? "nosso negócio"}
    />
  );
}
