import { getAuthUserForModule } from "@/lib/session";
import { parseCivilMonthFromQuery } from "@/lib/civil-date";
import { db } from "@/lib/db";
import { getExpenseCategories, getMonthlyExpenses } from "@/services/expense.service";
import { ExpensePanel } from "@/components/financial/expense-panel";

/**
 * Submódulo de despesas dentro do Financeiro.
 */
export default async function FinancialExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const user = await getAuthUserForModule("COMISSOES");
  const query = searchParams ? await searchParams : undefined;
  const selectedMonth = parseCivilMonthFromQuery(query?.month, query?.year);

  const [summary, categories, accounts] = await Promise.all([
    getMonthlyExpenses(user.tenantId, selectedMonth),
    getExpenseCategories(user.tenantId),
    db.financialAccount.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Despesas</h2>
        <p className="text-muted-foreground">
          Cadastre custos fixos e variáveis, acompanhe pendências do mês e integre as saídas ao extrato e ao caixa.
        </p>
      </div>

      <ExpensePanel
        period={summary.period}
        summary={summary}
        categories={categories}
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
        }))}
      />
    </div>
  );
}
