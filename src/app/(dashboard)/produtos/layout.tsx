import { redirect } from "next/navigation";
import { getModuleDefinition } from "@/lib/tenant-modules";
import { getAuthUserWithAccess } from "@/lib/session";
import { ProductsNav } from "@/components/inventory/products-nav";

/**
 * Layout do módulo Produtos.
 * Agrupa a visão geral do cadastro mestre e a operação de estoque em uma única navegação.
 */
export default async function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAccess();
  const hasProductsAccess = user.moduleAccess.PRODUTOS;
  const hasInventoryAccess = user.moduleAccess.ESTOQUE;

  if (!hasProductsAccess && !hasInventoryAccess) {
    const fallbackModule = user.allowedModules[0];
    redirect(fallbackModule ? getModuleDefinition(fallbackModule).href : "/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <p className="text-muted-foreground">
          Centralize o cadastro mestre dos itens e a operação de estoque dentro do mesmo módulo.
        </p>
      </div>
      <ProductsNav allowedModules={user.allowedModules} />
      {children}
    </div>
  );
}
