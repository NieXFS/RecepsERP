import { redirect } from "next/navigation";
import { BotSettingsPanel } from "@/components/settings/bot-settings-panel";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getAuthUserWithAccess, getTenantPlanSlug } from "@/lib/session";
import { hasPlanProduct } from "@/lib/plan-modules";
import { getBotConfigByTenantId } from "@/services/bot-config.service";

export default async function AtendenteIAPage() {
  const user = await getAuthUserWithAccess();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Verifica se o plano do tenant inclui o módulo bot
  const planSlug = await getTenantPlanSlug(user.tenantId);
  if (!hasPlanProduct(planSlug, "bot")) {
    return <ModuleUpsell product="bot" />;
  }

  const settings = await getBotConfigByTenantId(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Atendente IA</h1>
        <p className="text-muted-foreground">
          Configure como a Ana atende seus clientes no WhatsApp.
        </p>
      </div>
      <BotSettingsPanel settings={settings} />
    </div>
  );
}
