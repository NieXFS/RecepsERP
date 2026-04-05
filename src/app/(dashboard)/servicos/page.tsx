import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import {
  listServicesWithDetails,
  listProductsForSelect,
  listProfessionalsForSelect,
} from "@/services/catalog.service";
import { ServiceCatalogPanel } from "@/components/settings/service-catalog-panel";

/**
 * Página principal de serviços do ERP.
 * Centraliza o catálogo em uma rota em português sem depender do submenu de configurações.
 */
export default async function ServicesPage() {
  const user = await getAuthUser();

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    redirect("/dashboard");
  }

  const [services, products, professionals] = await Promise.all([
    listServicesWithDetails(user.tenantId),
    listProductsForSelect(user.tenantId),
    listProfessionalsForSelect(user.tenantId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">
          Organize o catálogo comercial, a ficha técnica e os profissionais aptos para cada serviço.
        </p>
      </div>
      <ServiceCatalogPanel
        services={services}
        products={products}
        professionals={professionals}
      />
    </div>
  );
}
