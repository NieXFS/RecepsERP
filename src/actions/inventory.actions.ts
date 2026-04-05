"use server";

import { requireModuleAccess } from "@/lib/session";
import { productSchema } from "@/lib/validators/management";
import {
  adjustInventory,
  createProduct,
  updateProduct,
} from "@/services/inventory.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: ajuste manual de estoque (entrada por compra ou perda/vencimento).
 * Exige acesso ao módulo de Estoque.
 * Cria movimentação rastreável em InventoryMovement para auditoria.
 */
export async function adjustInventoryAction(data: {
  productId: string;
  type: "ENTRY" | "LOSS";
  quantity: number;
  reason?: string;
  unitCost?: number;
}): Promise<ActionResult<{ movementId: string; newStock: number }>> {
  const user = await requireModuleAccess("ESTOQUE");

  return adjustInventory(user.tenantId, data);
}

/**
 * Server Action: cria um novo produto do tenant autenticado.
 * Exige acesso efetivo ao módulo de Produtos.
 */
export async function createProductAction(
  data: unknown
): Promise<ActionResult<{ productId: string }>> {
  const user = await requireModuleAccess("PRODUTOS");
  const parsed = productSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return createProduct(user.tenantId, parsed.data);
}

/**
 * Server Action: atualiza um produto existente sem recriar o registro.
 */
export async function updateProductAction(
  productId: string,
  data: unknown
): Promise<ActionResult<{ productId: string }>> {
  const user = await requireModuleAccess("PRODUTOS");
  const parsed = productSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return updateProduct(user.tenantId, productId, parsed.data);
}
