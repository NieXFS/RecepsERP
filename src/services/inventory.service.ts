import { db } from "@/lib/db";
import type { ActionResult } from "@/types";
import type { ProductInput } from "@/lib/validators/management";

/**
 * Lista todos os produtos do tenant com indicadores de estoque.
 * Retorna dados para a tabela de gestão de estoque, incluindo
 * status crítico baseado em minStock.
 */
export async function listProducts(tenantId: string) {
  const products = await db.product.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    type: p.type,
    costPrice: Number(p.costPrice),
    salePrice: Number(p.salePrice),
    stockQuantity: Number(p.stockQuantity),
    minStock: Number(p.minStock),
    unit: p.unit,
  }));
}

/**
 * Lista o catálogo completo de produtos do tenant, incluindo ativos e inativos.
 * A consulta alimenta a tela de gestão de produtos sem esconder itens desativados.
 */
export async function listProductCatalog(tenantId: string) {
  const products = await db.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    type: product.type,
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    stockQuantity: Number(product.stockQuantity),
    minStock: Number(product.minStock),
    unit: product.unit,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));
}

/**
 * Busca o histórico recente de movimentações de estoque de um produto.
 * Usado para auditoria e rastreabilidade.
 */
export async function getProductMovements(tenantId: string, productId: string) {
  const movements = await db.inventoryMovement.findMany({
    where: { tenantId, productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: Number(m.quantity),
    unitCost: m.unitCost ? Number(m.unitCost) : null,
    reason: m.reason,
    createdAt: m.createdAt.toISOString(),
  }));
}

/**
 * Cria um produto novo no catálogo do tenant e registra estoque inicial quando informado.
 */
export async function createProduct(
  tenantId: string,
  data: ProductInput
): Promise<ActionResult<{ productId: string }>> {
  const normalizedSku = data.sku?.trim() || null;

  if (normalizedSku) {
    const existingSku = await db.product.findFirst({
      where: {
        tenantId,
        sku: normalizedSku,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSku) {
      return { success: false, error: "Já existe um produto com este SKU neste tenant." };
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description ?? null,
          sku: normalizedSku,
          type: data.type,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          stockQuantity: data.stockQuantity,
          minStock: data.minStock,
          unit: data.unit,
          isActive: data.isActive,
        },
      });

      if (data.stockQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: product.id,
            type: "ENTRY",
            quantity: data.stockQuantity,
            unitCost: data.costPrice > 0 ? data.costPrice : null,
            reason: "Estoque inicial informado no cadastro do produto.",
          },
        });
      }

      return { productId: product.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar produto.";
    return { success: false, error: message };
  }
}

/**
 * Atualiza um produto existente preservando o mesmo Product.id.
 * Se o estoque for alterado, registra a diferença em InventoryMovement para manter rastreabilidade.
 */
export async function updateProduct(
  tenantId: string,
  productId: string,
  data: ProductInput
): Promise<ActionResult<{ productId: string }>> {
  const normalizedSku = data.sku?.trim() || null;

  const [product, existingSku] = await Promise.all([
    db.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    }),
    normalizedSku
      ? db.product.findFirst({
          where: {
            tenantId,
            sku: normalizedSku,
            deletedAt: null,
            id: { not: productId },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!product) {
    return { success: false, error: "Produto não encontrado." };
  }

  if (existingSku) {
    return { success: false, error: "Já existe um produto com este SKU neste tenant." };
  }

  const stockDelta = data.stockQuantity - Number(product.stockQuantity);

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          description: data.description ?? null,
          sku: normalizedSku,
          type: data.type,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          stockQuantity: data.stockQuantity,
          minStock: data.minStock,
          unit: data.unit,
          isActive: data.isActive,
        },
      });

      if (stockDelta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId,
            type: stockDelta > 0 ? "ENTRY" : "ADJUSTMENT",
            quantity: stockDelta,
            unitCost: data.costPrice > 0 ? data.costPrice : null,
            reason: "Ajuste de estoque realizado pela edição do produto.",
          },
        });
      }
    });

    return { success: true, data: { productId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar produto.";
    return { success: false, error: message };
  }
}

/**
 * Ajuste manual de estoque em transação ACID:
 *  1. Atualiza o stockQuantity do Product (incrementa para ENTRY, decrementa para LOSS)
 *  2. Cria um InventoryMovement para rastreabilidade (auditoria)
 *
 * Tipos aceitos:
 *  - ENTRY: entrada por compra/reposição (incrementa estoque)
 *  - LOSS: perda, vencimento, quebra (decrementa estoque)
 *
 * Não permite que o estoque fique negativo em caso de LOSS.
 */
export async function adjustInventory(
  tenantId: string,
  data: {
    productId: string;
    type: "ENTRY" | "LOSS";
    quantity: number;
    reason?: string;
    unitCost?: number;
  }
): Promise<ActionResult<{ movementId: string; newStock: number }>> {
  const { productId, type, quantity, reason, unitCost } = data;

  if (quantity <= 0) {
    return { success: false, error: "A quantidade deve ser maior que zero." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Busca o produto e valida pertinência ao tenant
      const product = await tx.product.findFirst({
        where: { id: productId, tenantId, deletedAt: null },
      });

      if (!product) {
        throw new Error("Produto não encontrado.");
      }

      const currentStock = Number(product.stockQuantity);

      // Para LOSS, valida se há estoque suficiente
      if (type === "LOSS" && currentStock < quantity) {
        throw new Error(
          `Estoque insuficiente para registrar perda. ` +
          `Disponível: ${currentStock} ${product.unit}, Informado: ${quantity} ${product.unit}.`
        );
      }

      // Calcula a variação: positiva para ENTRY, negativa para LOSS
      const stockDelta = type === "ENTRY" ? quantity : -quantity;
      const movementType = type === "ENTRY" ? "ENTRY" : "ADJUSTMENT";

      // Atualiza o estoque do produto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: stockDelta },
        },
      });

      // Registra a movimentação para auditoria
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId,
          type: movementType,
          quantity: stockDelta,
          unitCost: unitCost ?? null,
          reason:
            reason?.trim() ||
            (type === "ENTRY"
              ? `Entrada manual — Reposição de estoque`
              : `Saída manual — Perda/Vencimento`),
        },
      });

      return {
        movementId: movement.id,
        newStock: Number(updatedProduct.stockQuantity),
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao ajustar estoque.";
    return { success: false, error: message };
  }
}
