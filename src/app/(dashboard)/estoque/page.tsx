import { getAuthUserForModule } from "@/lib/session";
import { listProducts } from "@/services/inventory.service";
import { InventoryPanel } from "@/components/inventory/inventory-panel";

/**
 * Página de Gestão de Estoque (Server Component).
 * Acessível para ADMIN e RECEPTIONIST. A ação de ajuste manual
 * é restrita a ADMIN no Client Component (botão escondido).
 */
export default async function InventoryPage() {
  const user = await getAuthUserForModule("ESTOQUE");

  const products = await listProducts(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controle de Estoque</h1>
        <p className="text-muted-foreground">
          Monitore níveis de estoque e faça ajustes manuais de entrada e saída.
        </p>
      </div>
      <InventoryPanel products={products} userRole={user.role} />
    </div>
  );
}
