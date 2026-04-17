import { redirect } from "next/navigation";
import { AnaStudio } from "@/components/atendente-ia/ana-studio";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getAuthUserWithAccess, getTenantPlanSlug } from "@/lib/session";
import { hasPlanProduct } from "@/lib/plan-modules";
import { getBotConfigByTenantId } from "@/services/bot-config.service";

export default async function AtendenteIAPage() {
  const user = await getAuthUserWithAccess();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const planSlug = await getTenantPlanSlug(user.tenantId);
  if (!hasPlanProduct(planSlug, "bot")) {
    return <ModuleUpsell product="bot" />;
  }

  const settings = await getBotConfigByTenantId(user.tenantId);

  return <AnaStudio settings={settings} />;
}
