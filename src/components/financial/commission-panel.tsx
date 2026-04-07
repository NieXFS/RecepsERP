"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import { settleCommissionsAction } from "@/actions/financial.actions";

type CommissionDetail = {
  id: string;
  date: string;
  customerName: string;
  services: string;
  serviceAmount: number;
  commissionRate: number;
  commissionValue: number;
  clinicValue: number;
};

type ProfessionalSummary = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  commissionPercent: number;
  totalPending: number;
  totalClinic: number;
  commissionCount: number;
  commissions: CommissionDetail[];
};

type Account = {
  id: string;
  name: string;
  type: string;
};

/**
 * Painel de Fechamento de Comissões — exibe profissionais com cards expandíveis.
 * Cada card mostra o total PENDING, e ao expandir lista os serviços detalhados.
 * O botão "Realizar Acerto" abre um dialog de confirmação com seleção de conta.
 */
export function CommissionPanel({
  professionals,
  accounts,
}: {
  professionals: ProfessionalSummary[];
  accounts: Account[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [settleTarget, setSettleTarget] = useState<ProfessionalSummary | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalGlobalPending = professionals.reduce((sum, p) => sum + p.totalPending, 0);
  const totalGlobalClinic = professionals.reduce((sum, p) => sum + p.totalClinic, 0);
  const accountSelectOptions = accounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${account.type === "CASH" ? "Caixa" : account.type === "BANK" ? "Banco" : account.type})`,
  }));

  const professionalsWithCommissions = professionals.filter((p) => p.commissionCount > 0);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openSettleDialog(professional: ProfessionalSummary) {
    setSettleTarget(professional);
    setSelectedAccountId(accounts[0]?.id ?? "");
  }

  function handleSettle() {
    if (!settleTarget) return;

    startTransition(async () => {
      const result = await settleCommissionsAction(
        settleTarget.id,
        selectedAccountId || undefined
      );

      if (result.success) {
        toast.success(
          `Acerto realizado! ${result.data.paidCount} comissão(ões) pagas para ${settleTarget.name}.`
        );
        setSettleTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Pendente</p>
                <p className="text-xl font-bold">{fmt(totalGlobalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Retenção da Clínica</p>
                <p className="text-xl font-bold">{fmt(totalGlobalClinic)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Profissionais c/ Pendência</p>
                <p className="text-xl font-bold">{professionalsWithCommissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de profissionais */}
      {professionalsWithCommissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">Tudo em dia!</p>
            <p className="text-muted-foreground">
              Não há comissões pendentes para acerto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {professionalsWithCommissions.map((prof) => {
            const isExpanded = expandedId === prof.id;

            return (
              <Card key={prof.id}>
                <CardContent className="pt-6">
                  {/* Header do profissional */}
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(prof.id)}
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {prof.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{prof.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {prof.specialty ?? "Profissional"} · Taxa padrão: {prof.commissionPercent}%
                      </p>
                    </div>

                    {/* Resumo de valores */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">A Pagar</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {fmt(prof.totalPending)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Retenção</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {fmt(prof.totalClinic)}
                        </p>
                      </div>
                      <Badge variant="outline">{prof.commissionCount} serviço{prof.commissionCount > 1 ? "s" : ""}</Badge>
                    </div>

                    {/* Expand toggle */}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Mobile KPIs (visible on small screens only) */}
                  <div className="sm:hidden flex items-center gap-4 mt-3">
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                      A pagar: {fmt(prof.totalPending)}
                    </Badge>
                    <Badge variant="outline">{prof.commissionCount} serviço{prof.commissionCount > 1 ? "s" : ""}</Badge>
                  </div>

                  {/* Tabela expandida */}
                  {isExpanded && (
                    <div className="mt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="pb-2 font-medium">Data</th>
                              <th className="pb-2 font-medium">Cliente</th>
                              <th className="pb-2 font-medium">Serviço</th>
                              <th className="pb-2 font-medium text-right">Valor Serviço</th>
                              <th className="pb-2 font-medium text-right">Taxa</th>
                              <th className="pb-2 font-medium text-right">Comissão</th>
                              <th className="pb-2 font-medium text-right">Clínica</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prof.commissions.map((c) => (
                              <tr key={c.id} className="border-b last:border-0">
                                <td className="py-2.5 whitespace-nowrap">
                                  {new Date(c.date).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </td>
                                <td className="py-2.5">{c.customerName}</td>
                                <td className="py-2.5">{c.services}</td>
                                <td className="py-2.5 text-right">{fmt(c.serviceAmount)}</td>
                                <td className="py-2.5 text-right">{c.commissionRate}%</td>
                                <td className="py-2.5 text-right font-medium text-amber-600 dark:text-amber-400">
                                  {fmt(c.commissionValue)}
                                </td>
                                <td className="py-2.5 text-right text-muted-foreground">
                                  {fmt(c.clinicValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold">
                              <td colSpan={5} className="pt-3 text-right">
                                TOTAL:
                              </td>
                              <td className="pt-3 text-right text-amber-600 dark:text-amber-400">
                                {fmt(prof.totalPending)}
                              </td>
                              <td className="pt-3 text-right text-muted-foreground">
                                {fmt(prof.totalClinic)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Botão de acerto */}
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => openSettleDialog(prof)}
                          className="gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Realizar Acerto — {fmt(prof.totalPending)}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de confirmação do acerto */}
      <Dialog open={!!settleTarget} onOpenChange={(open) => !open && setSettleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Acerto de Comissões</DialogTitle>
            <DialogDescription>
              Você está prestes a pagar {settleTarget?.commissionCount} comissão(ões) para{" "}
              <strong>{settleTarget?.name}</strong> no valor total de{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                {settleTarget ? fmt(settleTarget.totalPending) : ""}
              </strong>.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Conta de saída (caixa)</label>
            <Select
              value={selectedAccountId}
              onValueChange={(v) => setSelectedAccountId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValueLabel
                  value={selectedAccountId}
                  options={accountSelectOptions}
                  placeholder="Selecione a conta..."
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type === "CASH" ? "Caixa" : acc.type === "BANK" ? "Banco" : acc.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O valor será debitado desta conta e registrado como despesa no fluxo de caixa.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleTarget(null)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSettle} disabled={isPending}>
              {isPending ? "Processando…" : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
