"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectValueLabel,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Plus,
  Minus,
  Warehouse,
} from "lucide-react";
import { adjustInventoryAction } from "@/actions/inventory.actions";

type Product = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  type: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStock: number;
  unit: string;
};

/**
 * Retorna o status do estoque com badge correspondente.
 * - Zerado → "Falta no Estoque" (badge vermelho)
 * - Abaixo do mínimo → "Estoque Crítico - Comprar" (badge vermelho)
 * - OK → "Normal" (badge verde)
 */
function getStockStatus(product: Product) {
  if (product.stockQuantity <= 0) {
    return { label: "Falta no Estoque", variant: "destructive" as const, icon: XCircle };
  }
  if (product.stockQuantity <= product.minStock) {
    return { label: "Estoque Crítico - Comprar", variant: "destructive" as const, icon: AlertTriangle };
  }
  return { label: "Normal", variant: "outline" as const, icon: CheckCircle };
}

/**
 * Painel de Gestão de Estoque — tabela de produtos com indicadores visuais
 * e modal de ajuste manual restrito a ADMIN.
 */
export function InventoryPanel({
  products,
  userRole,
}: {
  products: Product[];
  userRole: string;
}) {
  const [search, setSearch] = useState("");
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<"ENTRY" | "LOSS">("ENTRY");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustCost, setAdjustCost] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const adjustTypeOptions = [
    { value: "ENTRY", label: "Entrada (Compra / Reposição)" },
    { value: "LOSS", label: "Perda (Vencimento / Quebra)" },
  ] as const;

  const isAdmin = userRole === "ADMIN";

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false)
    );
  });

  // Contadores de estoque para os KPI cards
  const criticalCount = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStock
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;
  const normalCount = products.filter(
    (p) => p.stockQuantity > p.minStock
  ).length;

  function openAdjustDialog(product: Product) {
    setAdjustProduct(product);
    setAdjustType("ENTRY");
    setAdjustQty("");
    setAdjustReason("");
    setAdjustCost("");
  }

  function handleAdjust() {
    if (!adjustProduct) return;

    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida maior que zero.");
      return;
    }

    startTransition(async () => {
      const result = await adjustInventoryAction({
        productId: adjustProduct.id,
        type: adjustType,
        quantity: qty,
        reason: adjustReason || undefined,
        unitCost: adjustCost ? parseFloat(adjustCost) : undefined,
      });

      if (result.success) {
        toast.success(
          `Estoque atualizado! ${adjustProduct.name}: ${result.data.newStock} ${adjustProduct.unit}`
        );
        setAdjustProduct(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CONSUMABLE: "Consumível",
      RESALE: "Revenda",
      BOTH: "Ambos",
    };
    return labels[type] ?? type;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Estoque Normal</p>
                <p className="text-xl font-bold">{normalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Estoque Crítico</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Falta no Estoque</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de produtos */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Nenhum produto encontrado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Produto</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Tipo</th>
                    <th className="pb-2 font-medium hidden md:table-cell">SKU</th>
                    <th className="pb-2 font-medium text-right">Estoque</th>
                    <th className="pb-2 font-medium text-right hidden sm:table-cell">Mín.</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                    <th className="pb-2 font-medium text-right hidden md:table-cell">Custo</th>
                    {isAdmin && <th className="pb-2 font-medium text-center">Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const status = getStockStatus(product);
                    const StatusIcon = status.icon;

                    return (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {typeLabel(product.type)}
                          </Badge>
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {product.sku ?? "—"}
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {product.stockQuantity} {product.unit}
                        </td>
                        <td className="py-3 text-right hidden sm:table-cell text-muted-foreground">
                          {product.minStock} {product.unit}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={status.variant} className="gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            <span className="hidden lg:inline">{status.label}</span>
                          </Badge>
                        </td>
                        <td className="py-3 text-right hidden md:table-cell text-muted-foreground">
                          {fmt(product.costPrice)}
                        </td>
                        {isAdmin && (
                          <td className="py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustDialog(product)}
                            >
                              Ajustar
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Ajuste Manual de Estoque */}
      <Dialog open={!!adjustProduct} onOpenChange={(open) => !open && setAdjustProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
            <DialogDescription>
              Produto: <strong>{adjustProduct?.name}</strong>
              <br />
              Estoque atual: <strong>{adjustProduct?.stockQuantity} {adjustProduct?.unit}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo de ajuste */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de Movimentação</label>
              <Select
                value={adjustType}
                onValueChange={(v) => setAdjustType((v as "ENTRY" | "LOSS") ?? "ENTRY")}
              >
                <SelectTrigger className="w-full">
                  <SelectValueLabel value={adjustType} options={adjustTypeOptions} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">
                    <span className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-green-600" />
                      Entrada (Compra / Reposição)
                    </span>
                  </SelectItem>
                  <SelectItem value="LOSS">
                    <span className="flex items-center gap-2">
                      <Minus className="h-3.5 w-3.5 text-red-600" />
                      Perda (Vencimento / Quebra)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Quantidade ({adjustProduct?.unit})
              </label>
              <Input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Ex: 10"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>

            {/* Custo unitário (apenas para entrada) */}
            {adjustType === "ENTRY" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Custo Unitário (opcional)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={adjustCost}
                  onChange={(e) => setAdjustCost(e.target.value)}
                />
              </div>
            )}

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <Input
                placeholder={
                  adjustType === "ENTRY"
                    ? "Ex: Compra NF #1234"
                    : "Ex: Produto vencido lote ABC"
                }
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProduct(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={isPending}>
              {isPending ? "Processando…" : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
