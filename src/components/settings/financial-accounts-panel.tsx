"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, Plus, Trash2, WalletCards } from "lucide-react";
import {
  createFinancialAccountAction,
  deactivateFinancialAccountAction,
} from "@/actions/financial-account.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FinancialAccountListItem } from "@/services/financial-account.service";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function translateAccountType(type: string) {
  const labels: Record<string, string> = {
    CASH: "Caixa",
    BANK: "Banco",
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    PIX: "Pix",
    OTHER: "Outro",
  };

  return labels[type] ?? type;
}

export function FinancialAccountsPanel({
  accounts,
}: {
  accounts: FinancialAccountListItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const activeAccountsCount = useMemo(
    () => accounts.filter((account) => account.isActive).length,
    [accounts]
  );

  function resetForm() {
    setName("");
    setInitialBalance("");
  }

  function handleOpenCreate(open: boolean) {
    if (!open) {
      resetForm();
    }

    setShowCreateModal(open);
  }

  function handleCreateAccount() {
    startTransition(async () => {
      const result = await createFinancialAccountAction({
        name,
        type: "BANK",
        initialBalance: Number(initialBalance || 0),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Conta financeira criada com sucesso.");
      handleOpenCreate(false);
      router.refresh();
    });
  }

  function handleDeactivateAccount(account: FinancialAccountListItem) {
    if (!account.isActive) {
      toast.error("Esta conta ja esta desativada.");
      return;
    }

    if (activeAccountsCount <= 1) {
      toast.error("Mantenha pelo menos uma conta ativa no sistema.");
      return;
    }

    if (!confirm(`Deseja desativar a conta "${account.name}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateFinancialAccountAction(account.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Conta "${account.name}" desativada.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-muted-foreground" />
              Contas Financeiras
            </CardTitle>
            <CardDescription>
              Cadastre contas bancárias e acompanhe quais destinos financeiros estão ativos para agenda, caixa e comissões.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </CardHeader>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma conta financeira cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <CardDescription>{translateAccountType(account.type)}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      account.isActive
                        ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                        : "border-border text-muted-foreground"
                    }
                  >
                    {account.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Saldo atual</p>
                  <p className="mt-1 text-xl font-semibold">{formatCurrency(account.balance)}</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" />
                    {account.type === "CASH"
                      ? "Conta operacional de caixa"
                      : "Disponivel para recebimentos e repasses"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeactivateAccount(account)}
                    disabled={isPending || !account.isActive || activeAccountsCount <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Desativar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={handleOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta ativa para recebimentos, pagamentos e integração com os modais financeiros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome da conta</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='Ex.: "Banco Itaú"'
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Saldo inicial</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={initialBalance}
                onChange={(event) => setInitialBalance(event.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenCreate(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAccount} disabled={isPending}>
              {isPending ? "Salvando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
