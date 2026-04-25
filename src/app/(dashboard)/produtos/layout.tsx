import { ModuleUpsell } from "@/components/billing/module-upsell";
import type { ModuleAccessReason } from "@/lib/module-access";
import { getModuleAccess } from "@/lib/module-access";
import { getAuthUserWithAccess } from "@/lib/session";
import { ProductsNav } from "@/components/inventory/products-nav";

type ModuleBlockReason = Exclude<ModuleAccessReason, { granted: true }>["reason"];

function getCombinedBlockReason(accesses: ModuleAccessReason[]): ModuleBlockReason {
  const denied = accesses.filter(
    (access): access is Exclude<ModuleAccessReason, { granted: true }> => !access.granted
  );

  if (denied.some((access) => access.reason === "permission-denied")) {
    return "permission-denied";
  }

  if (denied.some((access) => access.reason === "plan-locked")) {
    return "plan-locked";
  }

  return "module-disabled";
}

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
  const [productsAccess, inventoryAccess] = await Promise.all([
    getModuleAccess(user, user.tenantId, "PRODUTOS"),
    getModuleAccess(user, user.tenantId, "ESTOQUE"),
  ]);
  const hasProductsAccess = productsAccess.granted;
  const hasInventoryAccess = inventoryAccess.granted;

  if (!hasProductsAccess && !hasInventoryAccess) {
    return (
      <ModuleUpsell
        product="erp"
        reason={getCombinedBlockReason([productsAccess, inventoryAccess])}
      />
    );
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
