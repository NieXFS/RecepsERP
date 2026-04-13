import { redirect } from "next/navigation";
import { BusinessSettingsPanel } from "@/components/settings/business-settings-panel";
import { getAuthUserForModule } from "@/lib/session";
import { getTenantBusinessSettings } from "@/services/tenant-settings.service";

export default async function BusinessSettingsPage() {
  const user = await getAuthUserForModule("CONFIGURACOES");

  if (user.role !== "ADMIN") {
    redirect("/configuracoes/aparencia");
  }

  const settings = await getTenantBusinessSettings(user.tenantId);

  return <BusinessSettingsPanel settings={settings} />;
}
