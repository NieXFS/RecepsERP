import { getAuthUserForPermission } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import {
  formatCivilDateToQuery,
  getTodayCivilDate,
  parseCivilDate,
  type CivilDate,
} from "@/lib/civil-date";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FINANCIAL_STATEMENT_STATUS_VALUES,
  FINANCIAL_STATEMENT_TYPE_VALUES,
} from "@/lib/validators/financial";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { getFinancialStatement } from "@/services/financial.service";
import { ExportButton } from "@/components/financial/export-button";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getDefaultPeriod() {
  const today = getTodayCivilDate();

  return {
    start: {
      year: today.year,
      month: today.month,
      day: 1,
    } satisfies CivilDate,
    end: today,
  };
}

function parseTypeFilter(value?: string | string[]) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return FINANCIAL_STATEMENT_TYPE_VALUES.includes(
    (normalized ?? "ALL") as (typeof FINANCIAL_STATEMENT_TYPE_VALUES)[number]
  )
    ? ((normalized ?? "ALL") as (typeof FINANCIAL_STATEMENT_TYPE_VALUES)[number])
    : "ALL";
}

function parseStatusFilter(value?: string | string[]) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return FINANCIAL_STATEMENT_STATUS_VALUES.includes(
    (normalized ?? "ALL") as (typeof FINANCIAL_STATEMENT_STATUS_VALUES)[number]
  )
    ? ((normalized ?? "ALL") as (typeof FINANCIAL_STATEMENT_STATUS_VALUES)[number])
    : "ALL";
}

/**
 * Extrato financeiro por período com filtros de data e resumo consolidado.
 */
export default async function FinancialStatementPage({
  searchParams,
}: {
  searchParams?: Promise<{
    from?: string | string[];
    to?: string | string[];
    type?: string | string[];
    status?: string | string[];
  }>;
}) {
  const user = await getAuthUserForPermission("financeiro.extrato", "view");
  const canExport = hasPermission(user.customPermissions, "financeiro.extrato", "view");
  const query = searchParams ? await searchParams : undefined;
  const defaults = getDefaultPeriod();

  const startDate = parseCivilDate(query?.from) ?? defaults.start;
  const endDate = parseCivilDate(query?.to) ?? defaults.end;
  const typeFilter = parseTypeFilter(query?.type);
  const statusFilter = parseStatusFilter(query?.status);

  const statement = await getFinancialStatement(user.tenantId, {
    startDate,
    endDate,
    type: typeFilter,
    status: statusFilter,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h2 className="text-xl font-semibold tracking-tight">Extrato por datas</h2>
        <p className="text-muted-foreground">
          Consulte entradas, saídas e saldo do período com base nos lançamentos financeiros do tenant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data inicial</label>
              <Input type="date" name="from" defaultValue={formatCivilDateToQuery(startDate)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data final</label>
              <Input type="date" name="to" defaultValue={formatCivilDateToQuery(endDate)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <select
                name="type"
                defaultValue={typeFilter}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ALL">Todos</option>
                <option value="INCOME">Entradas</option>
                <option value="EXPENSE">Saídas</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Vencido</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="REFUNDED">Estornado</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="Entradas" value={formatCurrency(statement.summary.entradas)} />
        <SummaryCard label="Saídas" value={formatCurrency(statement.summary.saidas)} />
        <SummaryCard
          label="Saldo do período"
          value={formatCurrency(statement.summary.saldoPeriodo)}
          emphasize={
            statement.summary.saldoPeriodo >= 0 ? "text-emerald-600" : "text-red-600"
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>
            Lançamentos encontrados ({statement.summary.totalLancamentos})
          </CardTitle>
          {canExport ? (
            <ExportButton
              endpoint="extrato"
              filters={{
                from: formatCivilDateToQuery(startDate),
                to: formatCivilDateToQuery(endDate),
                type: typeFilter,
                status: statusFilter,
              }}
              suggestedFilename={`extrato_${formatCivilDateToQuery(startDate)}_${formatCivilDateToQuery(endDate)}`}
            />
          ) : null}
        </CardHeader>
        <CardContent>
          {statement.entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado para o período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Descrição</th>
                    <th className="pb-2 font-medium">Conta</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-3 whitespace-nowrap">
                        {new Date(entry.effectiveDate).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{entry.description ?? "Sem descrição"}</div>
                        <div className="text-xs text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[entry.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? entry.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3">
                        {entry.accountName ?? "Sem conta"}
                        {entry.accountType ? (
                          <div className="text-xs text-muted-foreground">{entry.accountType}</div>
                        ) : null}
                      </td>
                      <td className="py-3">
                        {entry.type === "INCOME" ? "Entrada" : "Saída"}
                      </td>
                      <td className="py-3">{translatePaymentStatus(entry.paymentStatus)}</td>
                      <td
                        className={`py-3 text-right font-medium ${
                          entry.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${emphasize ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function translatePaymentStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    OVERDUE: "Vencido",
    CANCELLED: "Cancelado",
    REFUNDED: "Estornado",
  };

  return labels[status] ?? status;
}
