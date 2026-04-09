import { getAuthUserForModule } from "@/lib/session";
import {
  getCashRegisterOverview,
  getOpenSessionTransactions,
} from "@/services/financial.service";
import { CashRegisterPanel } from "@/components/financial/cash-register-panel";

/**
 * Submódulo operacional de caixa com abertura, fechamento e histórico.
 */
export default async function CashRegisterPage() {
  const user = await getAuthUserForModule("COMISSOES");
  const overview = await getCashRegisterOverview(user.tenantId);
  const sessionMovements = overview.currentSession
    ? await getOpenSessionTransactions(
        user.tenantId,
        overview.currentSession.accountId,
        new Date(overview.currentSession.openedAt)
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Caixa</h2>
        <p className="text-muted-foreground">
          Controle abertura, fechamento e conferência do caixa operacional do estabelecimento.
        </p>
      </div>
      <CashRegisterPanel
        accounts={overview.accounts}
        currentSession={overview.currentSession}
        sessionMovements={sessionMovements}
        recentSessions={overview.recentSessions}
      />
    </div>
  );
}
