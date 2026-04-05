import { AppearancePanel } from "@/components/settings/appearance-panel";
import { getAuthUser } from "@/lib/session";
import { getTenantAppearanceSettings } from "@/services/tenant-settings.service";

/**
 * Página de aparência do tenant.
 * Expõe a paleta visual persistida separadamente do dark/light mode.
 */
export default async function AppearancePage() {
  const user = await getAuthUser();
  const tenant = await getTenantAppearanceSettings(user.tenantId);

  return (
    <AppearancePanel
      tenantName={tenant.name}
      currentTheme={tenant.accentTheme}
    />
  );
}
