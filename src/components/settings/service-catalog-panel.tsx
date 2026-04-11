"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AnimatedList } from "@/components/ui/animated-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogFooter as DialogFooter,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
  AnimatedDialogTrigger as DialogTrigger,
} from "@/components/ui/animated-dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  FlaskConical,
  Users,
  X,
  Search,
} from "lucide-react";
import {
  createServiceAction,
  updateServiceAction,
  deactivateServiceAction,
} from "@/actions/catalog.actions";

/* ────────────── Types ────────────── */

type Material = {
  id: string;
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
};

type ProfessionalLink = {
  id: string;
  professionalId: string;
  professionalName: string;
  customCommissionPercent: number | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  materials: Material[];
  professionals: ProfessionalLink[];
};

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  type: string;
};

type ProfessionalOption = {
  id: string;
  name: string;
  commissionPercent: number;
};

// Form-local types (without DB ids)
type FormMaterial = { productId: string; quantity: string };
type FormProfessional = { professionalId: string; customCommission: string };

/* ────────────── Component ────────────── */

/**
 * Painel de Catálogo de Serviços — lista serviços com modal de criação/edição.
 * O modal inclui ficha técnica (ServiceMaterial) e profissionais aptos (ProfessionalService).
 */
export function ServiceCatalogPanel({
  services,
  products,
  professionals,
}: {
  services: ServiceRow[];
  products: ProductOption[];
  professionals: ProfessionalOption[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [formMaterials, setFormMaterials] = useState<FormMaterial[]>([]);
  const [formProfessionals, setFormProfessionals] = useState<FormProfessional[]>([]);

  const productSelectOptions = products.map((product) => ({
    value: product.id,
    label: `${product.name} (${product.unit})`,
  }));
  const professionalSelectOptions = professionals.map((professional) => ({
    value: professional.id,
    label: `${professional.name} (padrão: ${professional.commissionPercent}%)`,
  }));
  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) => {
      const haystacks = [service.name, service.description ?? ""];

      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }, [search, services]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setDuration("");
    setPrice("");
    setFormMaterials([]);
    setFormProfessionals([]);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(service: ServiceRow) {
    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description ?? "");
    setDuration(String(service.durationMinutes));
    setPrice(String(service.price));
    setFormMaterials(
      service.materials.map((m) => ({
        productId: m.productId,
        quantity: String(m.quantity),
      }))
    );
    setFormProfessionals(
      service.professionals.map((p) => ({
        professionalId: p.professionalId,
        customCommission: p.customCommissionPercent != null ? String(p.customCommissionPercent) : "",
      }))
    );
    setShowModal(true);
  }

  function handleDeactivate(service: ServiceRow) {
    if (!confirm(`Deseja realmente desativar "${service.name}"?`)) return;

    startTransition(async () => {
      const result = await deactivateServiceAction(service.id);
      if (result.success) {
        toast.success(`"${service.name}" foi desativado.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  // ── Material list management ──
  function addMaterial() {
    setFormMaterials((prev) => [...prev, { productId: "", quantity: "" }]);
  }

  function removeMaterial(idx: number) {
    setFormMaterials((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateMaterial(idx: number, field: keyof FormMaterial, value: string) {
    setFormMaterials((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  }

  // ── Professional list management ──
  function addProfessional() {
    setFormProfessionals((prev) => [...prev, { professionalId: "", customCommission: "" }]);
  }

  function removeProfessional(idx: number) {
    setFormProfessionals((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateProfessional(idx: number, field: keyof FormProfessional, value: string) {
    setFormProfessionals((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("O nome do serviço é obrigatório.");
      return;
    }

    const durationNum = parseInt(duration);
    const priceNum = parseFloat(price);

    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Duração deve ser um número positivo.");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Preço deve ser um número válido.");
      return;
    }

    // Parse materials (ignore incomplete rows)
    const materials = formMaterials
      .filter((m) => m.productId && m.quantity)
      .map((m) => ({
        productId: m.productId,
        quantity: parseFloat(m.quantity),
      }))
      .filter((m) => !isNaN(m.quantity) && m.quantity > 0);

    // Parse professionals (ignore incomplete rows)
    const profLinks = formProfessionals
      .filter((p) => p.professionalId)
      .map((p) => ({
        professionalId: p.professionalId,
        customCommissionPercent: p.customCommission
          ? parseFloat(p.customCommission)
          : undefined,
      }));

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      durationMinutes: durationNum,
      price: priceNum,
      materials,
      professionals: profLinks,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateServiceAction(editingId, data)
        : await createServiceAction(data);

      if (result.success) {
        toast.success(editingId ? "Serviço atualizado!" : "Serviço criado!");
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredServices.length} serviço{filteredServices.length !== 1 ? "s" : ""} exibido{filteredServices.length !== 1 ? "s" : ""}
        </p>
        <DialogTrigger
          render={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo Serviço
            </Button>
          }
        />
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Buscar por nome ou descrição do serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de serviços */}
      {services.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum serviço cadastrado. Crie o primeiro!
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum serviço encontrado para a busca atual.
          </CardContent>
        </Card>
      ) : (
        <AnimatedList className="grid gap-3" stagger={40}>
          {filteredServices.map((service) => (
            <Card key={service.id} className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{service.name}</p>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {service.durationMinutes}min
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <DollarSign className="h-3 w-3" aria-hidden="true" />
                        {fmt(service.price)}
                      </Badge>
                    </div>

                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}

                    {/* Ficha técnica */}
                    {service.materials.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Ficha Técnica:</span>
                        {service.materials.map((m) => (
                          <Badge key={m.id} variant="secondary" className="text-xs">
                            {m.productName} ({m.quantity} {m.productUnit})
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Profissionais */}
                    {service.professionals.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs text-muted-foreground">Profissionais:</span>
                        {service.professionals.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-xs">
                            {p.professionalName}
                            {p.customCommissionPercent != null && ` (${p.customCommissionPercent}%)`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeactivate(service)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </AnimatedList>
      )}

      {/* Dialog: Criar/Editar Serviço */}
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-2">
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-6">
                {/* Dados básicos */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nome *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Limpeza de Pele" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do serviço" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Duração (min) *</label>
                      <Input
                        type="number"
                        min="5"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Preço (R$) *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ficha Técnica */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4" />
                      Ficha Técnica (Materiais)
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="gap-1 text-xs">
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>

                  {formMaterials.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum material vinculado. Adicione produtos consumidos neste serviço.
                    </p>
                  )}

                  {formMaterials.map((mat, idx) => (
                    <div key={idx} className="grid gap-3 rounded-xl border bg-muted/15 p-3 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-end">
                      <div className="space-y-1">
                        {idx === 0 && <label className="text-xs text-muted-foreground">Produto</label>}
                        <Select
                          value={mat.productId}
                          onValueChange={(v) => updateMaterial(idx, "productId", v ?? "")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValueLabel
                              value={mat.productId}
                              options={productSelectOptions}
                              placeholder="Selecionar..."
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        {idx === 0 && <label className="text-xs text-muted-foreground">Qtd</label>}
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={mat.quantity}
                          onChange={(e) => updateMaterial(idx, "quantity", e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(idx)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Profissionais Aptos */}
                <div className="space-y-4 pb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Profissionais Aptos
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addProfessional} className="gap-1 text-xs">
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>

                  {formProfessionals.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum profissional vinculado. Defina quem pode realizar este serviço.
                    </p>
                  )}

                  {formProfessionals.map((prof, idx) => (
                    <div key={idx} className="grid gap-3 rounded-xl border bg-muted/15 p-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end">
                      <div className="space-y-1">
                        {idx === 0 && <label className="text-xs text-muted-foreground">Profissional</label>}
                        <Select
                          value={prof.professionalId}
                          onValueChange={(v) => updateProfessional(idx, "professionalId", v ?? "")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValueLabel
                              value={prof.professionalId}
                              options={professionalSelectOptions}
                              placeholder="Selecionar..."
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} (padrão: {p.commissionPercent}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        {idx === 0 && <label className="text-xs text-muted-foreground">Comissão %</label>}
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={prof.customCommission}
                          onChange={(e) => updateProfessional(idx, "customCommission", e.target.value)}
                          placeholder="Padrão"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProfessional(idx)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {formProfessionals.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Deixe &quot;Comissão %&quot; em branco para usar a taxa padrão do profissional.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none px-6 py-4">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando…" : editingId ? "Atualizar" : "Criar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
}
