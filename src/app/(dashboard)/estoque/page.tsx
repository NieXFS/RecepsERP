import { redirect } from "next/navigation";

/**
 * Compatibilidade com a rota antiga de estoque.
 * O destino principal agora vive em /produtos/estoque.
 */
export default async function InventoryPage() {
  redirect("/produtos/estoque");
}
