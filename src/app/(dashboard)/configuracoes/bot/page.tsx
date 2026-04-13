import { redirect } from "next/navigation";
import { BotSettingsPanel } from "@/components/settings/bot-settings-panel";
import { getAuthUserForModule } from "@/lib/session";
import { getBotConfigByTenantId } from "@/services/bot-config.service";

export default async function BotSettingsPage() {
  const user = await getAuthUserForModule("CONFIGURACOES");

  if (user.role !== "ADMIN") {
    redirect("/configuracoes/aparencia");
  }

  const settings = await getBotConfigByTenantId(user.tenantId);

  return <BotSettingsPanel settings={settings} />;
}
