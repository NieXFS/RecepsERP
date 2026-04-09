"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Pencil,
  Receipt,
  Tags,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  cancelExpenseAction,
  cancelExpensePaymentAction,
  createExpenseAction,
  createExpenseCategoryAction,
  deleteExpenseAction,
  markExpenseAsPaidAction,
  updateExpenseAction,
} from "@/actions/expenses.actions";
import { addMonthsToCivilMonth } from "@/lib/civil-date";
import type {
  ExpenseCategoryListItem,
  MonthlyExpense,
  MonthlyExpenseSummary,
} from "@/services/expense.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AccountOption = {
  id: string;
  name: string;
  type: string;
};

type ExpensePanelProps = {
  period: MonthlyExpenseSummary["period"];
  summary: MonthlyExpenseSummary;
  categories: ExpenseCategoryListItem[];
  canEdit: boolean;
  accounts: AccountOption[];
};

type ExpenseFormState = {
  categoryId: string;
  accountId: string;
  description: string;
  type: "FIXED" | "VARIABLE";
  amount: string;
  dueDate: string;
  recurrence:
    | "MONTHLY"
    | "BIMONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "YEARLY"
    | "NONE";
  notes: string;
};

type StatusFilter = "ALL" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
type TypeFilter = "ALL" | "FIXED" | "VARIABLE";

/**
 * Painel operacional das despesas do módulo Financeiro.
 * Mantém a navegação mensal, filtros, cadastros e ações de pagamento no lado cliente.
 */
export function ExpensePanel({
  period,
  summary,
  categories,
  canEdit,
  accounts,
}: ExpensePanelProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isPending, startTransition] = useTransition();
  const [expenseDialogState, setExpenseDialogState] = useState<{
    open: boolean;
    expense?: MonthlyExpense;
  }>({ open: false });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [payDialogState, setPayDialogState] = useState<{
    open: boolean;
    expense?: MonthlyExpense;
  }>({ open: false });
  const [deleteDialogState, setDeleteDialogState] = useState<{
    open: boolean;
    expense?: MonthlyExpense;
  }>({ open: false });

  const filteredExpenses = useMemo(() => {
    return summary.expenses.filter((expense) => {
      const matchesType = typeFilter === "ALL" || expense.type === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" || expense.displayStatus === statusFilter;

      return matchesType && matchesStatus;
    });
  }, [statusFilter, summary.expenses, typeFilter]);

  function navigateMonth(offset: number) {
    const nextPeriod = addMonthsToCivilMonth(period, offset);
    router.push(
      `/financeiro/despesas?month=${nextPeriod.month}&year=${nextPeriod.year}`
    );
  }

  function handleCreateOrUpdateExpense(values: ExpenseFormState, expenseId?: string) {
    startTransition(async () => {
      const payload = {
        categoryId: values.categoryId,
        accountId: values.accountId || null,
        description: values.description,
        type: values.type,
        amount: Number(values.amount.replace(",", ".")),
        dueDate: values.dueDate,
        recurrence: values.type === "FIXED" ? values.recurrence : "NONE",
        notes: values.notes || undefined,
      };

      const result = expenseId
        ? await updateExpenseAction(expenseId, payload)
        : await createExpenseAction({
            ...payload,
            accountId: payload.accountId ?? undefined,
          });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(expenseId ? "Despesa atualizada." : "Despesa criada com sucesso.");
      setExpenseDialogState({ open: false });
      router.refresh();
    });
  }

  function handleCreateCategory(values: { name: string; description?: string }) {
    startTransition(async () => {
      const result = await createExpenseCategoryAction(values);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Categoria criada com sucesso.");
      setCategoryDialogOpen(false);
      router.refresh();
    });
  }

  function handleMarkPaid(expenseId: string, accountId?: string | null) {
    startTransition(async () => {
      const result = await markExpenseAsPaidAction({ expenseId, accountId });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Despesa registrada como paga.");
      setPayDialogState({ open: false });
      router.refresh();
    });
  }

  function handleCancelPayment(expenseId: string) {
    if (!window.confirm("Cancelar o pagamento desta despesa?")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelExpensePaymentAction(expenseId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pagamento cancelado e lançamento estornado.");
      router.refresh();
    });
  }

  function handleCancelExpense(expenseId: string) {
    if (!window.confirm("Cancelar esta despesa?")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelExpenseAction(expenseId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Despesa cancelada.");
      router.refresh();
    });
  }

  function handleDeleteExpense(expenseId: string, deleteAllFuture = false) {
    startTransition(async () => {
      const result = await deleteExpenseAction(expenseId, { deleteAllFuture });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        deleteAllFuture
          ? `${result.data?.deletedCount ?? 0} despesa(s) foram excluídas em cascata.`
          : "Despesa excluída."
      );
      setDeleteDialogState({ open: false });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Despesas do mês</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {period.label}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {canEdit ? (
                <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
                  <Tags className="h-4 w-4" />
                  Nova categoria
                </Button>
              ) : null}
              {canEdit ? (
                <Button onClick={() => setExpenseDialogState({ open: true })}>
                  <CirclePlus className="h-4 w-4" />
                  Nova despesa
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          label="Despesas Fixas"
          value={formatCurrency(summary.despesasFixas)}
          note={`${summary.fixedPaidCount} despesa(s) paga(s)`}
        />
        <SummaryCard
          label="Despesas Variáveis"
          value={formatCurrency(summary.despesasVariaveis)}
          note={`${summary.variablePaidCount} despesa(s) paga(s)`}
        />
        <SummaryCard
          label="Total do Mês"
          value={formatCurrency(summary.totalDespesas)}
          note={`+ ${formatCurrency(summary.totalPendentes)} pendente(s)`}
          accent="text-red-600"
        />
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Lista de despesas</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe despesas pagas, pendentes e vencidas do período selecionado.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilterSelect
              label="Tipo"
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as TypeFilter)}
              options={[
                { value: "ALL", label: "Todas" },
                { value: "FIXED", label: "Fixas" },
                { value: "VARIABLE", label: "Variáveis" },
              ]}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { value: "ALL", label: "Todas" },
                { value: "PENDING", label: "Pendentes" },
                { value: "PAID", label: "Pagas" },
                { value: "OVERDUE", label: "Vencidas" },
                { value: "CANCELLED", label: "Canceladas" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma despesa encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Descrição</th>
                    <th className="pb-2 pr-4 font-medium">Categoria</th>
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="min-w-[120px] pb-2 pr-6 font-medium text-right whitespace-nowrap">
                      Valor
                    </th>
                    <th className="min-w-[118px] pb-2 pl-4 pr-4 font-medium whitespace-nowrap">
                      Vencimento
                    </th>
                    <th className="min-w-[118px] pb-2 pr-4 font-medium whitespace-nowrap">
                      Pago em
                    </th>
                    <th className="pb-2 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => {
                    const statusMeta = getExpenseStatusMeta(expense.displayStatus);
                    const isLocked = expense.status === "PAID";
                    const paymentActionButton = canEdit
                      ? expense.status === "PAID"
                        ? (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleCancelPayment(expense.id)}
                            >
                              <Receipt className="h-3 w-3" />
                              Cancelar pagamento
                            </Button>
                          )
                        : (
                            <Button
                              size="xs"
                              disabled={isPending || expense.status === "CANCELLED"}
                              onClick={() =>
                                setPayDialogState({ open: true, expense })
                              }
                            >
                              <Wallet className="h-3 w-3" />
                              Pagar
                            </Button>
                          )
                      : null;

                    return (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <Badge className={statusMeta.className} variant="outline">
                            {statusMeta.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes ? (
                            <div className="text-xs text-muted-foreground">{expense.notes}</div>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            Conta: {expense.accountName ?? "Definir no pagamento"}
                          </div>
                        </td>
                        <td className="py-3 pr-4">{expense.category}</td>
                        <td className="py-3 pr-4">
                          {expense.type === "FIXED" ? "Fixa" : "Variável"}
                        </td>
                        <td className="py-3 pr-6 text-right font-medium whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 pl-4 pr-4 whitespace-nowrap">
                          {formatDate(expense.dueDate)}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {formatDateTime(expense.paidAt)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {paymentActionButton}
                            {canEdit ? (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={isPending || isLocked}
                                onClick={() =>
                                  setExpenseDialogState({ open: true, expense })
                                }
                              >
                                <Pencil className="h-3 w-3" />
                                Editar
                              </Button>
                            ) : null}
                            {canEdit && expense.status !== "PAID" && expense.status !== "CANCELLED" ? (
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleCancelExpense(expense.id)}
                              >
                                <XCircle className="h-3 w-3" />
                                Cancelar
                              </Button>
                            ) : null}
                            {canEdit && (expense.status === "PENDING" || expense.status === "CANCELLED") ? (
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={isPending}
                                onClick={() => setDeleteDialogState({ open: true, expense })}
                              >
                                <Trash2 className="h-3 w-3" />
                                Excluir
                              </Button>
                            ) : null}
                          </div>
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

      {canEdit ? (
        <ExpenseFormDialog
          key={`${expenseDialogState.expense?.id ?? "new"}-${expenseDialogState.open ? "open" : "closed"}`}
          open={expenseDialogState.open}
          expense={expenseDialogState.expense}
          categories={categories}
          accounts={accounts}
          isPending={isPending}
          onClose={() => setExpenseDialogState({ open: false })}
          onSubmit={handleCreateOrUpdateExpense}
        />
      ) : null}

      {canEdit ? (
        <ExpenseCategoryDialog
          key={categoryDialogOpen ? "category-open" : "category-closed"}
          open={categoryDialogOpen}
          isPending={isPending}
          onClose={() => setCategoryDialogOpen(false)}
          onSubmit={handleCreateCategory}
        />
      ) : null}

      {canEdit ? (
        <ExpensePaymentDialog
          key={`${payDialogState.expense?.id ?? "payment"}-${payDialogState.open ? "open" : "closed"}`}
          open={payDialogState.open}
          expense={payDialogState.expense}
          accounts={accounts}
          isPending={isPending}
          onClose={() => setPayDialogState({ open: false })}
          onConfirm={handleMarkPaid}
        />
      ) : null}

      {canEdit ? (
        <AlertDialog
          open={deleteDialogState.open}
          onOpenChange={(open) =>
            setDeleteDialogState((current) => ({ ...current, open }))
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteDialogState.expense?.recurrenceGroupId
                  ? "Excluir Despesa Recorrente"
                  : "Excluir despesa"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialogState.expense?.recurrenceGroupId
                  ? "Escolha se deseja excluir apenas esta despesa ou remover esta e as proximas pendentes da mesma recorrencia."
                  : "Tem certeza que deseja excluir esta despesa? Esta acao nao podera ser desfeita."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogState({ open: false })}
                disabled={isPending}
              >
                Cancelar
              </Button>
              {deleteDialogState.expense?.recurrenceGroupId ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      deleteDialogState.expense &&
                      handleDeleteExpense(deleteDialogState.expense.id, false)
                    }
                    disabled={isPending}
                  >
                    Excluir apenas esta
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      deleteDialogState.expense &&
                      handleDeleteExpense(deleteDialogState.expense.id, true)
                    }
                    disabled={isPending}
                  >
                    Excluir esta e as proximas
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteDialogState.expense &&
                    handleDeleteExpense(deleteDialogState.expense.id, false)
                  }
                  disabled={isPending}
                >
                  Excluir
                </Button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

function ExpenseFormDialog({
  open,
  expense,
  categories,
  accounts,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  expense?: MonthlyExpense;
  categories: ExpenseCategoryListItem[];
  accounts: AccountOption[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ExpenseFormState, expenseId?: string) => void;
}) {
  const [form, setForm] = useState<ExpenseFormState>(() =>
    buildExpenseFormState(categories[0]?.id ?? "", expense)
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar despesa" : "Nova despesa"}</DialogTitle>
          <DialogDescription>
            Cadastre saídas fixas e variáveis para manter o financeiro do estabelecimento atualizado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <span>Categoria</span>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <span>Tipo</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as ExpenseFormState["type"],
                    recurrence:
                      event.target.value === "FIXED" ? current.recurrence : "NONE",
                  }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="FIXED">Fixa</option>
                <option value="VARIABLE">Variável</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <span>Banco / conta</span>
              <select
                value={form.accountId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, accountId: event.target.value }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Escolher no pagamento</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({translateAccountType(account.type)})
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <span>Descrição</span>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Ex.: Aluguel do espaço - Abril/2026"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <span>Valor (R$)</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </Field>
            <Field>
              <span>Vencimento</span>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueDate: event.target.value }))
                }
              />
            </Field>
          </div>

          {form.type === "FIXED" ? (
            <Field>
              <span>Recorrência</span>
              <select
                value={form.recurrence}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurrence: event.target.value as ExpenseFormState["recurrence"],
                  }))
                }
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="NONE">Sem recorrência</option>
                <option value="MONTHLY">Mensal</option>
                <option value="BIMONTHLY">Bimestral</option>
                <option value="QUARTERLY">Trimestral</option>
                <option value="SEMIANNUAL">Semestral</option>
                <option value="YEARLY">Anual</option>
              </select>
            </Field>
          ) : null}

          <Field>
            <span>Observações</span>
            <Textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Observações internas sobre a despesa"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={() => onSubmit(form, expense?.id)}
          >
            {isPending ? "Salvando..." : expense ? "Salvar alterações" : "Criar despesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseCategoryDialog({
  open,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Crie categorias personalizadas para organizar melhor as despesas do estabelecimento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <span>Nome</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <span>Descrição</span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={isPending}
            onClick={() =>
              onSubmit({
                name,
                description: description || undefined,
              })
            }
          >
            {isPending ? "Salvando..." : "Criar categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpensePaymentDialog({
  open,
  expense,
  accounts,
  isPending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  expense?: MonthlyExpense;
  accounts: AccountOption[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (expenseId: string, accountId?: string | null) => void;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    if (expense?.accountId && accounts.some((account) => account.id === expense.accountId)) {
      return expense.accountId;
    }

    return "__auto__";
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            A despesa será marcada como paga e uma saída será criada no extrato e, se possível, vinculada ao caixa/conta selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border bg-muted/15 p-4">
            <p className="font-medium">{expense?.description}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {expense?.category} · {expense?.type === "FIXED" ? "Fixa" : "Variável"}
            </p>
            <p className="mt-3 text-lg font-semibold">
              {expense ? formatCurrency(expense.amount) : "—"}
            </p>
          </div>

          <Field>
            <span>Conta financeira</span>
            <select
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="__auto__">Automático (caixa aberto / primeira conta ativa)</option>
              <option value="__none__">Sem conta vinculada</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({translateAccountType(account.type)})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !expense}
            onClick={() =>
              expense &&
              onConfirm(
                expense.id,
                selectedAccountId === "__auto__"
                  ? undefined
                  : selectedAccountId === "__none__"
                    ? null
                    : selectedAccountId
              )
            }
          >
            {isPending ? "Processando..." : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", accent)}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  children,
}: {
  children: ReactNode;
}) {
  return <label className="grid gap-1.5 text-sm">{children}</label>;
}

function buildExpenseFormState(
  defaultCategoryId: string,
  expense?: MonthlyExpense
): ExpenseFormState {
  return {
    categoryId: expense?.categoryId ?? defaultCategoryId,
    accountId: expense?.accountId ?? "",
    description: expense?.description ?? "",
    type: expense?.type ?? "FIXED",
    amount: expense ? String(expense.amount) : "",
    dueDate: expense?.dueDate ?? "",
    recurrence: expense?.recurrence ?? "NONE",
    notes: expense?.notes ?? "",
  };
}

function getExpenseStatusMeta(status: MonthlyExpense["displayStatus"]) {
  const config = {
    PENDING: {
      label: "Pendente",
      className:
        "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
    },
    PAID: {
      label: "Paga",
      className:
        "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200",
    },
    OVERDUE: {
      label: "Vencida",
      className:
        "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200",
    },
    CANCELLED: {
      label: "Cancelada",
      className:
        "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-200",
    },
  } as const;

  return config[status];
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function translateAccountType(type: string) {
  const labels: Record<string, string> = {
    CASH: "Caixa",
    BANK: "Banco",
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    PIX: "PIX",
    OTHER: "Outro",
  };

  return labels[type] ?? type;
}
