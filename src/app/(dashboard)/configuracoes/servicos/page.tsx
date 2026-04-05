import { getAuthUserForModule } from "@/lib/session";
import {
  listServicesWithDetails,
  listProductsForSelect,
  listProfessionalsForSelect,
} from "@/services/catalog.service";
import { ServiceCatalogPanel } from "@/components/settings/service-catalog-panel";

/**
 * Página de Catálogo de Serviços (Server Component).
 * Busca serviços com ficha técnica e profissionais, além das listas
 * de products e professionals para os selects do modal.
 */
export default async function ServiceCatalogPage() {
  const user = await getAuthUserForModule("SERVICOS");

  const [services, products, professionals] = await Promise.all([
    listServicesWithDetails(user.tenantId),
    listProductsForSelect(user.tenantId),
    listProfessionalsForSelect(user.tenantId),
  ]);

  return (
    <ServiceCatalogPanel
      services={services}
      products={products}
      professionals={professionals}
    />
  );
}
