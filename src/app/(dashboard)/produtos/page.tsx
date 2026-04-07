import { redirect } from "next/navigation";
import { getAuthUserWithAccess } from "@/lib/session";
import { listProductCatalog } from "@/services/inventory.service";
import { ProductCatalogPanel } from "@/components/inventory/product-catalog-panel";

/**
 * Página inicial de produtos.
 * Oferece uma visão limpa do catálogo com ponte direta para o módulo de estoque.
 */
export default async function ProductsPage() {
  const user = await getAuthUserWithAccess();

  if (!user.moduleAccess.PRODUTOS) {
    if (user.moduleAccess.ESTOQUE) {
      redirect("/produtos/estoque");
    }

    redirect("/dashboard");
  }

  const products = await listProductCatalog(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Geral</h2>
        <p className="text-muted-foreground">
          Gerencie o cadastro mestre dos itens, preços, unidade e status sem confundir essa tela com a operação diária do estoque.
        </p>
      </div>

      <ProductCatalogPanel products={products} />
    </div>
  );
}
