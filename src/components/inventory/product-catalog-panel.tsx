"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Package2,
  Pencil,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectValueLabel,
} from "@/components/ui/select";
import {
  createProductAction,
  updateProductAction,
} from "@/actions/inventory.actions";

type ProductRow = {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function getStockStatus(product: ProductRow) {
  if (product.stockQuantity <= 0) {
    return {
      label: "Sem estoque",
      icon: XCircle,
      className: "text-red-600",
    };
  }

  if (product.stockQuantity <= product.minStock) {
    return {
      label: "Crítico",
      icon: AlertTriangle,
      className: "text-amber-600",
    };
  }

  return {
    label: "Normal",
    icon: CheckCircle2,
    className: "text-emerald-600",
  };
}

/**
 * Painel operacional de produtos com criação e edição do mesmo registro.
 */
export function ProductCatalogPanel({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState<"CONSUMABLE" | "RESALE" | "BOTH">("CONSUMABLE");
  const [unit, setUnit] = useState("un");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [minStock, setMinStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const productTypeOptions = [
    { value: "CONSUMABLE", label: "Consumível" },
    { value: "RESALE", label: "Revenda" },
    { value: "BOTH", label: "Ambos" },
  ] as const;
  const statusOptions = [
    { value: "ACTIVE", label: "Ativo" },
    { value: "INACTIVE", label: "Inativo" },
  ] as const;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.unit.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  function resetForm() {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setSku("");
    setType("CONSUMABLE");
    setUnit("un");
    setCostPrice("");
    setSalePrice("");
    setStockQuantity("0");
    setMinStock("0");
    setIsActive(true);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(product: ProductRow) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description ?? "");
    setSku(product.sku ?? "");
    setType((product.type as typeof type) ?? "CONSUMABLE");
    setUnit(product.unit);
    setCostPrice(String(product.costPrice));
    setSalePrice(String(product.salePrice));
    setStockQuantity(String(product.stockQuantity));
    setMinStock(String(product.minStock));
    setIsActive(product.isActive);
    setShowModal(true);
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        sku: sku.trim() || undefined,
        type,
        unit: unit.trim(),
        costPrice: Number(costPrice || 0),
        salePrice: Number(salePrice || 0),
        stockQuantity: Number(stockQuantity || 0),
        minStock: Number(minStock || 0),
        isActive,
      };

      const result = editingProduct
        ? await updateProductAction(editingProduct.id, payload)
        : await createProductAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      setShowModal(false);
      resetForm();
      router.refresh();
    });
  }

  const activeCount = products.filter((product) => product.isActive).length;
  const inactiveCount = products.filter((product) => !product.isActive).length;
  const sellableCount = products.filter(
    (product) => product.isActive && product.salePrice > 0
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Produtos ativos" value={activeCount} description="Disponíveis para uso e venda" />
        <SummaryCard title="Produtos inativos" value={inactiveCount} description="Ocultos do catálogo operacional" />
        <SummaryCard title="Com preço de venda" value={sellableCount} description="Itens prontos para comercialização" />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Catálogo de produtos</CardTitle>
            <CardDescription>
              Mantenha o cadastro mestre dos itens com foco em identificação, precificação e status comercial.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou SKU"
                className="pl-9"
              />
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Produto</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Cadastro</th>
                    <th className="py-2 pr-4 font-medium">Preços</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    const StockIcon = stockStatus.icon;

                    return (
                      <tr key={product.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku || "—"} · unidade: {product.unit}
                            </p>
                            {product.description ? (
                              <p className="text-xs text-muted-foreground">{product.description}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Estoque atual: {product.stockQuantity} {product.unit} · mínimo {product.minStock} {product.unit}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatProductType(product.type)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <p>SKU: {product.sku || "—"}</p>
                          <p>Unidade: {product.unit}</p>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <p>Custo: {formatCurrency(product.costPrice)}</p>
                          <p>Venda: {formatCurrency(product.salePrice)}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col gap-2">
                            <Badge variant={product.isActive ? "outline" : "secondary"}>
                              {product.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <StockIcon className={`h-3.5 w-3.5 ${stockStatus.className}`} />
                              <span>{stockStatus.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Atualize o mesmo registro do produto sem criar duplicatas."
                : "Cadastre um novo produto para uso interno, revenda ou ambos."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Ácido Glicólico 10%" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Observações rápidas sobre o item"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">SKU</label>
              <Input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="COD-001" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unidade</label>
              <Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="un, ml, g..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onValueChange={(value) => setType((value as typeof type) ?? "CONSUMABLE")}>
                <SelectTrigger className="w-full">
                  <SelectValueLabel value={type} options={productTypeOptions} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSUMABLE">Consumível</SelectItem>
                  <SelectItem value="RESALE">Revenda</SelectItem>
                  <SelectItem value="BOTH">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                onValueChange={(value) => setIsActive(value === "ACTIVE")}
              >
                <SelectTrigger className="w-full">
                  <SelectValueLabel
                    value={isActive ? "ACTIVE" : "INACTIVE"}
                    options={statusOptions}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço de custo</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(event) => setCostPrice(event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço de venda</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(event) => setSalePrice(event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-4 md:col-span-2">
              <div>
                <p className="text-sm font-medium">Parâmetros de estoque</p>
                <p className="text-xs text-muted-foreground">
                  Defina os valores iniciais do item. O acompanhamento operacional detalhado fica na subárea Estoque.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estoque atual</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estoque mínimo</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={minStock}
                    onChange={(event) => setMinStock(event.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : editingProduct ? "Salvar alterações" : "Criar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-start justify-between py-5">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Package2 className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatProductType(type: string) {
  const labels: Record<string, string> = {
    CONSUMABLE: "Consumível",
    RESALE: "Revenda",
    BOTH: "Ambos",
  };

  return labels[type] ?? type;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
