import { BillingPlanAdminPanel } from "@/components/internal/billing-plan-admin-panel";
import { requireSuperAdmin } from "@/lib/session";
import { listAdminPlans } from "@/services/billing.service";

export default async function RecepsPlansPage() {
  await requireSuperAdmin();
  const plans = await listAdminPlans();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Planos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os planos do ERP, placeholders locais e IDs reais da Stripe.
        </p>
      </div>

      <BillingPlanAdminPanel
        plans={plans.map((plan) => ({
          ...plan,
          priceMonthly: Number(plan.priceMonthly),
        }))}
      />
    </div>
  );
}
