import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import {
  listPackagesWithDetails,
  listServicesForPackageSelect,
} from "@/services/package.service";
import { PackagePanel } from "@/components/packages/package-panel";

/**
 * Página inicial de pacotes.
 * Evita 404 e já organiza a visão do módulo para expansão futura.
 */
export default async function PackagesPage() {
  const user = await getAuthUser();

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    redirect("/dashboard");
  }

  const [packages, services] = await Promise.all([
    listPackagesWithDetails(user.tenantId),
    listServicesForPackageSelect(user.tenantId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pacotes</h1>
        <p className="text-muted-foreground">
          Cadastre e mantenha pacotes comerciais com serviços vinculados, preço e validade.
        </p>
      </div>

      <PackagePanel
        packages={packages}
        serviceOptions={services.map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          price: Number(service.price),
        }))}
      />
    </div>
  );
}
