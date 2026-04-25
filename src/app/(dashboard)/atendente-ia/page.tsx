import { AnaStudio } from "@/components/atendente-ia/ana-studio";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { db } from "@/lib/db";
import { getAuthUserWithAccess } from "@/lib/session";
import { getModuleAccess } from "@/lib/module-access";
import { getBotConfigByTenantId } from "@/services/bot-config.service";
import { getAutomationsVMForTenant } from "@/services/bot-automation.service";

export default async function AtendenteIAPage() {
  const user = await getAuthUserWithAccess();
  const access = await getModuleAccess(user, user.tenantId, "ATENDENTE_IA");
  if (!access.granted) {
    return <ModuleUpsell product="bot" reason={access.reason} />;
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
    settings.metaConnectionSource ?? "",
    settings.metaConnectedAt ?? "",
  ].join("|");

  const embeddedSignupEnabled = process.env.META_EMBEDDED_SIGNUP_ENABLED === "true";
  const metaAppId = process.env.META_APP_ID?.trim() ?? "";
  const metaConfigId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ?? "";

  return (
    <AnaStudio
      key={studioKey}
      settings={settings}
      automations={automations}
      tenantName={tenant?.name ?? "nosso negócio"}
      embeddedSignupEnabled={embeddedSignupEnabled}
      metaAppId={metaAppId}
      metaConfigId={metaConfigId}
    />
  );
}
