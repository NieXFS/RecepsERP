import { redirect } from "next/navigation";
import { getAuthUserWithAccess } from "@/lib/session";
import { listProducts } from "@/services/inventory.service";
import { InventoryPanel } from "@/components/inventory/inventory-panel";

/**
 * Subárea operacional de estoque dentro do módulo Produtos.
 */
export default async function ProductsInventoryPage() {
  const user = await getAuthUserWithAccess();

  if (!user.moduleAccess.ESTOQUE) {
    if (user.moduleAccess.PRODUTOS) {
      redirect("/produtos");
    }

    redirect("/dashboard");
  }

  const products = await listProducts(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Estoque</h2>
        <p className="text-muted-foreground">
          Acompanhe saldo, mínimo, criticidade e ajustes manuais sem misturar essa rotina com o cadastro mestre dos produtos.
        </p>
      </div>

      <InventoryPanel products={products} userRole={user.role} />
    </div>
  );
}
