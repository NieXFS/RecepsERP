"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  CheckCircle2,
  ChevronsRight,
  Clock3,
  Download,
  Landmark,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import {
  closeCashRegisterAction,
  openCashRegisterAction,
} from "@/actions/financial.actions";
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
import {
  CashMovementModal,
  type CashMovementType,
} from "@/components/financial/cash-movement-modal";
import { CashHistoryFilters } from "@/components/financial/cash-history-filters";
import { CashSessionDetailDialog } from "@/components/financial/cash-session-detail-dialog";
import { SessionMovementsTable } from "@/components/financial/session-movements-table";
import {
  CASH_HISTORY_DEFAULT_LIMIT,
  CASH_HISTORY_MAX_LIMIT,
  CASH_HISTORY_PAGE_STEP,
} from "@/lib/cash-history-filters";
import { cn } from "@/lib/utils";
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
  totalSales: number;
  totalReinforcements: number;
  totalWithdrawals: number;
  totalOtherExpenses: number;
  expectedBalance: number;
};

type RecentCashSession = {
  id: string;
  accountId: string;
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
  totalSales: number;
  totalReinforcements: number;
  totalWithdrawals: number;
  totalOtherExpenses: number;
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

export type CashHistoryFilterState = {
  accountId: string;
  fromInput: string;
  toInput: string;
  limit: number;
};

/**
 * Painel operacional de caixa com abertura, fechamento e histórico recente.
 */
export function CashRegisterPanel({
  accounts,
  canEdit,
  currentSession,
  sessionMovements,
  recentSessions,
  historyHasMore,
  historyFilters,
  lastClosedAccountBalances,
}: {
  accounts: CashAccount[];
  canEdit: boolean;
  currentSession: CashSession | null;
  sessionMovements: CashSessionMovement[];
  recentSessions: RecentCashSession[];
  historyHasMore: boolean;
  historyFilters: CashHistoryFilterState;
  lastClosedAccountBalances?: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const firstAccountId = accounts[0]?.id ?? "";
  const [selectedAccountId, setSelectedAccountId] = useState(firstAccountId);
  const suggestedOpeningAmount =
    lastClosedAccountBalances?.[selectedAccountId] ?? null;
  const [openingAmount, setOpeningAmount] = useState(
    suggestedOpeningAmount != null ? String(suggestedOpeningAmount) : ""
  );
  const [openingUsedSuggestion, setOpeningUsedSuggestion] = useState(
    suggestedOpeningAmount != null
  );
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState(
    currentSession ? String(currentSession.expectedBalance) : ""
  );
  const [closingNotes, setClosingNotes] = useState("");
  const [cashMovementType, setCashMovementType] =
    useState<CashMovementType>("WITHDRAWAL");
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAccountId(firstAccountId);
  }, [firstAccountId]);

  useEffect(() => {
    const suggestion = lastClosedAccountBalances?.[selectedAccountId];
    if (suggestion != null) {
      setOpeningAmount(String(suggestion));
      setOpeningUsedSuggestion(true);
    } else {
      setOpeningAmount("");
      setOpeningUsedSuggestion(false);
    }
  }, [selectedAccountId, lastClosedAccountBalances]);

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

  const parsedClosingAmount = Number(closingAmount || 0);
  const closingDifference = currentSession
    ? parsedClosingAmount - currentSession.expectedBalance
    : 0;
  const closingDifferenceAbs = Math.abs(closingDifference);
  const closingDifferenceThreshold = currentSession
    ? Math.max(currentSession.expectedBalance * 0.05, 50)
    : 0;
  const showClosingWarning =
    currentSession != null &&
    closingAmount !== "" &&
    closingDifferenceAbs > closingDifferenceThreshold;

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
      setOpeningUsedSuggestion(false);
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

  function openCashMovementModal(type: CashMovementType) {
    setCashMovementType(type);
    setIsCashMovementModalOpen(true);
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
                    <p className="text-sm text-muted-foreground">
                      {currentSession.accountName}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Clock3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Caixa fechado</p>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma sessão em andamento
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Movimento do turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSession ? (
              <div className="space-y-1.5">
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(
                    currentSession.totalSales +
                      currentSession.totalReinforcements -
                      currentSession.totalWithdrawals
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vendas {formatCurrency(currentSession.totalSales)} · Reforços{" "}
                  {formatCurrency(currentSession.totalReinforcements)} · Sangrias{" "}
                  −{formatCurrency(currentSession.totalWithdrawals)}
                </p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">Nenhuma sessão aberta</p>
              </>
            )}
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
              Inicial + vendas + reforços − sangrias
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
                Nenhuma conta do tipo caixa está ativa. Ative uma conta financeira do tipo
                CASH para operar o módulo.
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
                      onChange={(event) => {
                        setOpeningAmount(event.target.value);
                        setOpeningUsedSuggestion(false);
                      }}
                      placeholder="0,00"
                    />
                    {openingUsedSuggestion && suggestedOpeningAmount != null ? (
                      <p className="text-xs text-muted-foreground">
                        Valor baseado no fechamento anterior (
                        {formatCurrency(suggestedOpeningAmount)}).
                      </p>
                    ) : null}
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
                    Esta conta pode ser visualizada, mas apenas usuários com permissão
                    de edição podem abrir novas sessões de caixa.
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
                      Responsável: {currentSession.openedByName}
                    </p>
                    <p className="text-muted-foreground">
                      Abertura em {formatDateTime(currentSession.openedAt)}
                    </p>
                    <p className="text-muted-foreground">{currentSession.accountName}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiBlock
                label="Vendas"
                value={formatCurrency(currentSession.totalSales)}
                icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-emerald-600 dark:text-emerald-400"
                wrapperClass="bg-emerald-500/10"
              />
              <KpiBlock
                label="Reforços"
                value={formatCurrency(currentSession.totalReinforcements)}
                icon={<ArrowUpToLine className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-sky-600 dark:text-sky-400"
                wrapperClass="bg-sky-500/10"
              />
              <KpiBlock
                label="Sangrias"
                value={formatCurrency(currentSession.totalWithdrawals)}
                icon={<ArrowDownToLine className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-red-600 dark:text-red-400"
                wrapperClass="bg-red-500/10"
              />
              <KpiBlock
                label="Saldo esperado"
                value={formatCurrency(currentSession.expectedBalance)}
                icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-primary"
                wrapperClass="bg-primary/10"
                highlight
              />
            </div>

            {currentSession.openingNotes ? (
              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Observação de abertura:
                </span>{" "}
                {currentSession.openingNotes}
              </div>
            ) : null}

            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Composição do saldo esperado
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <CompositionRow
                  label="Valor inicial"
                  value={formatCurrency(currentSession.openingAmount)}
                />
                <CompositionRow
                  label="+ Vendas"
                  value={formatCurrency(currentSession.totalSales)}
                  accent="text-emerald-600 dark:text-emerald-400"
                />
                <CompositionRow
                  label="+ Reforços"
                  value={formatCurrency(currentSession.totalReinforcements)}
                  accent="text-sky-600 dark:text-sky-400"
                />
                <CompositionRow
                  label="− Sangrias"
                  value={`-${formatCurrency(currentSession.totalWithdrawals)}`}
                  accent="text-red-600 dark:text-red-400"
                />
                {currentSession.totalOtherExpenses > 0 ? (
                  <CompositionRow
                    label="− Outras saídas"
                    value={`-${formatCurrency(currentSession.totalOtherExpenses)}`}
                    accent="text-muted-foreground"
                  />
                ) : null}
                <div className="border-t pt-2">
                  <CompositionRow
                    label="= Saldo esperado"
                    value={formatCurrency(currentSession.expectedBalance)}
                    emphasize
                  />
                </div>
              </dl>
            </div>

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
                {showClosingWarning ? (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle
                      className="mt-0.5 h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Diferença de {formatCurrency(closingDifferenceAbs)} detectada.
                      Conferir contagem ou registrar sangria pendente.
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Diferença estimada</label>
                <div
                  className={cn(
                    "flex h-8 items-center rounded-lg border border-input bg-muted/20 px-2.5 text-sm tabular-nums",
                    closingDifference === 0
                      ? "text-muted-foreground"
                      : closingDifference > 0
                        ? "text-emerald-600"
                        : "text-red-600"
                  )}
                >
                  {formatCurrency(closingDifference)}
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
                <Button
                  onClick={handleCloseCashRegister}
                  disabled={isPending}
                  className="gap-2"
                >
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
                <CardTitle>Extrato da sessão atual</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Movimentações do turno atual, com filtro por tipo e ordenação pelas mais
                  recentes primeiro.
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => openCashMovementModal("WITHDRAWAL")}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Sangria
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 text-emerald-700 dark:text-emerald-300"
                    onClick={() => openCashMovementModal("REINFORCEMENT")}
                  >
                    <ArrowUpToLine className="h-4 w-4" />
                    Reforço
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
        <CardHeader className="gap-3">
          <div>
            <CardTitle>Histórico de sessões</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clique em uma sessão para ver o extrato completo e baixar o Z.
            </p>
          </div>
          <CashHistoryFilters
            accounts={accounts}
            initialAccountId={historyFilters.accountId}
            initialFromInput={historyFilters.fromInput}
            initialToInput={historyFilters.toInput}
            initialLimit={historyFilters.limit}
          />
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma sessão encontrada para este filtro.
            </div>
          ) : (
            <>
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
                      <th
                        className="hidden pb-2 font-medium md:table-cell"
                        aria-label="Ações"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                        onClick={() => setDetailSessionId(session.id)}
                      >
                        <td className="py-3">
                          <div className="font-medium">{session.accountName}</div>
                          <div className="text-xs text-muted-foreground">
                            {session.openedByName}
                            {session.closedByName ? ` → ${session.closedByName}` : ""}
                          </div>
                        </td>
                        <td className="py-3">{formatDateTime(session.openedAt)}</td>
                        <td className="py-3">{formatDateTime(session.closedAt)}</td>
                        <td className="py-3 text-right tabular-nums">
                          {formatCurrency(session.expectedBalance)}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {session.closingAmount != null
                            ? formatCurrency(session.closingAmount)
                            : "—"}
                        </td>
                        <td className="py-3 text-right tabular-nums">
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
                        <td className="hidden py-3 text-right md:table-cell">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            aria-label={`Baixar Z da sessão de ${session.accountName}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              window.location.assign(
                                `/api/financeiro/export/cash-session?sessionId=${encodeURIComponent(session.id)}&format=csv`
                              );
                            }}
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {historyHasMore ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={
                      isPending || historyFilters.limit >= CASH_HISTORY_MAX_LIMIT
                    }
                    onClick={() => {
                      const nextLimit = Math.min(
                        historyFilters.limit + CASH_HISTORY_PAGE_STEP,
                        CASH_HISTORY_MAX_LIMIT
                      );
                      const params = new URLSearchParams(searchParams?.toString() ?? "");
                      if (nextLimit === CASH_HISTORY_DEFAULT_LIMIT) {
                        params.delete("limit");
                      } else {
                        params.set("limit", String(nextLimit));
                      }
                      const query = params.toString();
                      startTransition(() => {
                        router.push(query ? `${pathname}?${query}` : pathname);
                      });
                    }}
                  >
                    <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                    Ver mais {CASH_HISTORY_PAGE_STEP} sessões
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {currentSession && canEdit ? (
        <CashMovementModal
          open={isCashMovementModalOpen}
          onOpenChange={setIsCashMovementModalOpen}
          sessionId={currentSession.id}
          type={cashMovementType}
          expectedBalance={currentSession.expectedBalance}
        />
      ) : null}

      <CashSessionDetailDialog
        open={detailSessionId !== null}
        onOpenChange={(next) => {
          if (!next) setDetailSessionId(null);
        }}
        sessionId={detailSessionId}
      />
    </div>
  );
}

function KpiBlock({
  label,
  value,
  icon,
  accentClass,
  wrapperClass,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClass: string;
  wrapperClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-primary/30 bg-primary/5" : "bg-muted/10"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            wrapperClass,
            accentClass
          )}
        >
          {icon}
        </span>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 text-lg font-semibold tabular-nums",
          highlight ? "text-primary" : ""
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CompositionRow({
  label,
  value,
  accent,
  emphasize = false,
}: {
  label: string;
  value: string;
  accent?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={cn(
          "text-muted-foreground",
          emphasize && "font-semibold text-foreground"
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          emphasize && "text-foreground",
          accent
        )}
      >
        {value}
      </dd>
    </div>
  );
}

