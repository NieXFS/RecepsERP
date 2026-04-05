"use client";

import type { ComponentType } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, PackageCheck, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
} from "@/components/ui/select";
import {
  createPackageAction,
  updatePackageAction,
} from "@/actions/package.actions";

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  totalSessions: number;
  price: number;
  validityDays: number | null;
  isActive: boolean;
  createdAt: string;
  soldCount: number;
  services: {
    id: string;
    serviceId: string;
    serviceName: string;
    quantity: number;
  }[];
};

type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

type FormService = {
  serviceId: string;
  quantity: string;
};

/**
 * Painel de pacotes com criação e edição preservando o mesmo Package.id.
 */
export function PackagePanel({
  packages,
  serviceOptions,
}: {
  packages: PackageRow[];
  serviceOptions: ServiceOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [price, setPrice] = useState("");
  const [validityDays, setValidityDays] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [services, setServices] = useState<FormService[]>([{ serviceId: "", quantity: "1" }]);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return packages;
    }

    return packages.filter((pkg) => {
      return (
        pkg.name.toLowerCase().includes(query) ||
        pkg.services.some((service) => service.serviceName.toLowerCase().includes(query))
      );
    });
  }, [packages, search]);

  function resetForm() {
    setEditingPackage(null);
    setName("");
    setDescription("");
    setTotalSessions("");
    setPrice("");
    setValidityDays("");
    setIsActive(true);
    setServices([{ serviceId: "", quantity: "1" }]);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(pkg: PackageRow) {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDescription(pkg.description ?? "");
    setTotalSessions(String(pkg.totalSessions));
    setPrice(String(pkg.price));
    setValidityDays(pkg.validityDays ? String(pkg.validityDays) : "");
    setIsActive(pkg.isActive);
    setServices(
      pkg.services.length > 0
        ? pkg.services.map((service) => ({
            serviceId: service.serviceId,
            quantity: String(service.quantity),
          }))
        : [{ serviceId: "", quantity: "1" }]
    );
    setShowModal(true);
  }

  function addServiceRow() {
    setServices((current) => [...current, { serviceId: "", quantity: "1" }]);
  }

  function removeServiceRow(index: number) {
    setServices((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function updateServiceRow(index: number, field: keyof FormService, value: string) {
    setServices((current) =>
      current.map((service, rowIndex) =>
        rowIndex === index ? { ...service, [field]: value } : service
      )
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Informe o nome do pacote.");
      return;
    }

    const normalizedServices = services
      .filter((service) => service.serviceId && service.quantity)
      .map((service) => ({
        serviceId: service.serviceId,
        quantity: Number(service.quantity),
      }));

    if (normalizedServices.length === 0) {
      toast.error("Vincule pelo menos um serviço ao pacote.");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        totalSessions: Number(totalSessions || 0),
        price: Number(price || 0),
        validityDays: validityDays ? Number(validityDays) : undefined,
        isActive,
        services: normalizedServices,
      };

      const result = editingPackage
        ? await updatePackageAction(editingPackage.id, payload)
        : await createPackageAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(editingPackage ? "Pacote atualizado com sucesso!" : "Pacote criado com sucesso!");
      setShowModal(false);
      resetForm();
      router.refresh();
    });
  }

  const activeCount = packages.filter((pkg) => pkg.isActive).length;
  const soldCount = packages.reduce((sum, pkg) => sum + pkg.soldCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Pacotes ativos"
          value={activeCount}
          description="Disponíveis para novas vendas"
          icon={PackageCheck}
        />
        <SummaryCard
          title="Pacotes vendidos"
          value={soldCount}
          description="Compras vinculadas a clientes"
          icon={CalendarClock}
        />
        <SummaryCard
          title="Pacotes cadastrados"
          value={packages.length}
          description="Portfólio atual do tenant"
          icon={PackageCheck}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Pacotes</CardTitle>
            <CardDescription>
              Cadastre ofertas comerciais com serviços vinculados, validade e total de sessões.
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou serviço"
                className="pl-9"
              />
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo pacote
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPackages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhum pacote encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Pacote</th>
                    <th className="py-2 pr-4 font-medium">Sessões</th>
                    <th className="py-2 pr-4 font-medium">Serviços</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => (
                    <tr key={pkg.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(pkg.price)}
                            {pkg.validityDays ? ` · validade ${pkg.validityDays} dias` : " · sem expiração"}
                          </p>
                          {pkg.description ? (
                            <p className="text-xs text-muted-foreground">{pkg.description}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {pkg.totalSessions} sessões
                        <p className="text-xs text-muted-foreground">{pkg.soldCount} venda(s)</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {pkg.services.map((service) => (
                            <Badge key={service.id} variant="outline">
                              {service.serviceName} x{service.quantity}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={pkg.isActive ? "outline" : "secondary"}>
                          {pkg.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => openEdit(pkg)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Editar pacote" : "Novo pacote"}</DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Atualize o mesmo pacote sem recriar o registro principal."
                : "Cadastre uma oferta comercial com validade e composição de serviços."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Pacote 10 Sessões Laser" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Observações comerciais do pacote"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Total de sessões</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={totalSessions}
                onChange={(event) => setTotalSessions(event.target.value)}
                placeholder="10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Validade em dias</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={validityDays}
                onChange={(event) => setValidityDays(event.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                onValueChange={(value) => setIsActive(value === "ACTIVE")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Serviços vinculados</label>
                <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={`${service.serviceId}-${index}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_140px_auto]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Serviço</label>
                      <Select
                        value={service.serviceId}
                        onValueChange={(value) => updateServiceRow(index, "serviceId", value ?? "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Qtd. sessões</label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={service.quantity}
                        onChange={(event) => updateServiceRow(index, "quantity", event.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeServiceRow(index)}
                        disabled={services.length === 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : editingPackage ? "Salvar alterações" : "Criar pacote"}
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
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
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
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
