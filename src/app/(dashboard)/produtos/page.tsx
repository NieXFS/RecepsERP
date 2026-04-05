import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { listProductCatalog } from "@/services/inventory.service";
import { ProductCatalogPanel } from "@/components/inventory/product-catalog-panel";

/**
 * Página inicial de produtos.
 * Oferece uma visão limpa do catálogo com ponte direta para o módulo de estoque.
 */
export default async function ProductsPage() {
  const user = await getAuthUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const products = await listProductCatalog(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <p className="text-muted-foreground">
          Cadastre e edite produtos do tenant sem depender da tela de estoque para manutenção básica.
        </p>
      </div>

      <ProductCatalogPanel products={products} />
    </div>
  );
}
