"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  CheckCircle2,
  Clock3,
  Landmark,
  Wallet,
} from "lucide-react";
import { openCashRegisterAction, closeCashRegisterAction } from "@/actions/financial.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { ManualTransactionModal } from "@/components/financial/manual-transaction-modal";
import { SessionMovementsTable } from "@/components/financial/session-movements-table";
import type { CashSessionMovement } from "@/services/financial.service";

type CashAccount = {
  id: string;
  name: string;
  balance: number;
};

type CashSession = {
  id: string;
  status: "OPEN" | "CLOSED";
  accountId: string;
  accountName: string;
  openedAt: string;
  openedByName: string;
  openedByAvatarUrl: string | null;
  openingAmount: number;
  openingNotes: string | null;
  totalEntries: number;
  totalExpenses: number;
  expectedBalance: number;
};

type RecentCashSession = {
  id: string;
  accountName: string;
  openedAt: string;
  closedAt: string | null;
  openedByName: string;
  closedByName: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedBalance: number;
  difference: number | null;
  status: "OPEN" | "CLOSED";
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Painel operacional de caixa com abertura, fechamento e histórico recente.
 */
export function CashRegisterPanel({
  accounts,
  canEdit,
  currentSession,
  sessionMovements,
  recentSessions,
}: {
  accounts: CashAccount[];
  canEdit: boolean;
  currentSession: CashSession | null;
  sessionMovements: CashSessionMovement[];
  recentSessions: RecentCashSession[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const firstAccountId = accounts[0]?.id ?? "";
  const [selectedAccountId, setSelectedAccountId] = useState(firstAccountId);
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState(
    currentSession ? String(currentSession.expectedBalance) : ""
  );
  const [closingNotes, setClosingNotes] = useState("");
  const [manualTransactionType, setManualTransactionType] = useState<"INCOME" | "EXPENSE">(
    "INCOME"
  );
  const [isManualTransactionModalOpen, setIsManualTransactionModalOpen] = useState(false);

  useEffect(() => {
    setSelectedAccountId(firstAccountId);
  }, [firstAccountId]);

  useEffect(() => {
    setClosingAmount(currentSession ? String(currentSession.expectedBalance) : "");
  }, [currentSession]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );
  const accountSelectOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: account.name,
      })),
    [accounts]
  );

  function handleOpenCashRegister() {
    startTransition(async () => {
      const result = await openCashRegisterAction({
        accountId: selectedAccountId,
        openingAmount: Number(openingAmount || 0),
        openingNotes: openingNotes.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Caixa aberto com sucesso.");
      setOpeningAmount("");
      setOpeningNotes("");
      router.refresh();
    });
  }

  function handleCloseCashRegister() {
    if (!currentSession) return;

    startTransition(async () => {
      const result = await closeCashRegisterAction({
        sessionId: currentSession.id,
        closingAmount: Number(closingAmount || 0),
        closingNotes: closingNotes.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Caixa fechado com sucesso.");
      setClosingNotes("");
      router.refresh();
    });
  }

  function openManualTransactionModal(type: "INCOME" | "EXPENSE") {
    setManualTransactionType(type);
    setIsManualTransactionModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {currentSession ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Caixa aberto</p>
                    <p className="text-sm text-muted-foreground">{currentSession.accountName}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Clock3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Caixa fechado</p>
                    <p className="text-sm text-muted-foreground">Nenhuma sessão em andamento</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas no Caixa Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(currentSession?.totalEntries ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Somatório de lançamentos pagos na conta caixa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(currentSession?.expectedBalance ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Valor inicial + entradas − saídas
            </p>
          </CardContent>
        </Card>
      </div>

      {!currentSession ? (
        <Card>
          <CardHeader>
            <CardTitle>Abertura de caixa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Inicie o turno do caixa informando conta, valor inicial e observações.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
                Nenhuma conta do tipo caixa está ativa. Ative uma conta financeira do tipo CASH para operar o módulo.
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Conta caixa</label>
                    <Select
                      value={selectedAccountId}
                      onValueChange={(value) => setSelectedAccountId(value ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValueLabel
                          value={selectedAccountId}
                          options={accountSelectOptions}
                          placeholder="Selecione a conta"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAccount ? (
                      <p className="text-xs text-muted-foreground">
                        Saldo atual da conta: {formatCurrency(selectedAccount.balance)}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Valor inicial</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={openingAmount}
                      onChange={(event) => setOpeningAmount(event.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Observação</label>
                  <Textarea
                    value={openingNotes}
                    onChange={(event) => setOpeningNotes(event.target.value)}
                    placeholder="Ex.: abertura do turno da manhã"
                  />
                </div>

                {canEdit ? (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleOpenCashRegister}
                      disabled={isPending || !selectedAccountId}
                      className="gap-2"
                    >
                      <Landmark className="h-4 w-4" />
                      {isPending ? "Abrindo…" : "Abrir caixa"}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Esta conta pode ser visualizada, mas apenas usuários com permissão de edição
                    podem abrir novas sessões de caixa.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage
                    src={currentSession.openedByAvatarUrl ?? undefined}
                    alt={currentSession.openedByName}
                  />
                  <AvatarFallback>{getInitials(currentSession.openedByName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle>Caixa aberto</CardTitle>
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium text-foreground">
                      Responsavel: {currentSession.openedByName}
                    </p>
                    <p className="text-muted-foreground">
                      Abertura em {formatDateTime(currentSession.openedAt)}
                    </p>
                    <p className="text-muted-foreground">{currentSession.accountName}</p>
                  </div>
                </div>
              </div>

              {canEdit ? (
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => openManualTransactionModal("EXPENSE")}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Sangria (Retirada)
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 text-emerald-700 dark:text-emerald-300"
                    onClick={() => openManualTransactionModal("INCOME")}
                  >
                    <ArrowUpToLine className="h-4 w-4" />
                    Suprimento (Entrada)
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Valor inicial"
                value={formatCurrency(currentSession.openingAmount)}
              />
              <MetricCard
                label="Entradas"
                value={formatCurrency(currentSession.totalEntries)}
              />
              <MetricCard
                label="Saídas"
                value={formatCurrency(currentSession.totalExpenses)}
              />
              <MetricCard
                label="Saldo esperado"
                value={formatCurrency(currentSession.expectedBalance)}
                highlight
              />
            </div>

            {currentSession.openingNotes ? (
              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Observação de abertura:</span>{" "}
                {currentSession.openingNotes}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total apurado no fechamento</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={(event) => setClosingAmount(event.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Diferença estimada</label>
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted/20 px-2.5 text-sm">
                  {formatCurrency(Number(closingAmount || 0) - currentSession.expectedBalance)}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observação do fechamento</label>
              <Textarea
                value={closingNotes}
                onChange={(event) => setClosingNotes(event.target.value)}
                placeholder="Ex.: conferência realizada com troco completo"
              />
            </div>

            {canEdit ? (
              <div className="flex justify-end">
                <Button onClick={handleCloseCashRegister} disabled={isPending} className="gap-2">
                  <Wallet className="h-4 w-4" />
                  {isPending ? "Fechando…" : "Fechar caixa"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {currentSession ? (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Extrato da Sessao Atual</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Movimentacoes do turno atual do caixa aberto, com entradas e saidas mais recentes primeiro.
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => openManualTransactionModal("EXPENSE")}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Sangria
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 text-emerald-700 dark:text-emerald-300"
                    onClick={() => openManualTransactionModal("INCOME")}
                  >
                    <ArrowUpToLine className="h-4 w-4" />
                    Suprimento
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <SessionMovementsTable transactions={sessionMovements} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Histórico recente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas sessões de caixa do estabelecimento.
          </p>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma sessão de caixa registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Conta</th>
                    <th className="pb-2 font-medium">Abertura</th>
                    <th className="pb-2 font-medium">Fechamento</th>
                    <th className="pb-2 font-medium text-right">Esperado</th>
                    <th className="pb-2 font-medium text-right">Apurado</th>
                    <th className="pb-2 font-medium text-right">Diferença</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{session.accountName}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.openedByName}
                          {session.closedByName ? ` → ${session.closedByName}` : ""}
                        </div>
                      </td>
                      <td className="py-3">{formatDateTime(session.openedAt)}</td>
                      <td className="py-3">{formatDateTime(session.closedAt)}</td>
                      <td className="py-3 text-right">{formatCurrency(session.expectedBalance)}</td>
                      <td className="py-3 text-right">
                        {session.closingAmount != null ? formatCurrency(session.closingAmount) : "—"}
                      </td>
                      <td className="py-3 text-right">
                        {session.difference != null ? (
                          <span
                            className={
                              session.difference === 0
                                ? "text-muted-foreground"
                                : session.difference > 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                            }
                          >
                            {formatCurrency(session.difference)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            session.status === "OPEN"
                              ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {session.status === "OPEN" ? "Aberto" : "Fechado"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {currentSession && canEdit ? (
        <ManualTransactionModal
          open={isManualTransactionModalOpen}
          onOpenChange={setIsManualTransactionModalOpen}
          accountId={currentSession.accountId}
          type={manualTransactionType}
        />
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
