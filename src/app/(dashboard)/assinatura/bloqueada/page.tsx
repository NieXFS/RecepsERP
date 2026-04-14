import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/subscription-guard";

export default async function SubscriptionBlockedPage() {
  const user = await getAuthUser();
  const status = await getSubscriptionStatus(user.tenantId);

  if (status.hasAccess) {
    redirect("/dashboard");
  }

  const showPortalCta = ["PAST_DUE", "UNPAID", "INCOMPLETE"].includes(status.status);
  const showCheckoutCta = ["CANCELED", "NONE", "INCOMPLETE_EXPIRED"].includes(status.status);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Assinatura bloqueada</CardTitle>
          <CardDescription>
            O acesso ao ERP fica liberado apenas com assinatura em trial ou ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-medium">Status atual</p>
            <p className="mt-2 text-lg font-semibold">{status.status}</p>
            <p className="mt-2 text-sm text-muted-foreground">{status.reason}</p>
          </div>

          {showPortalCta ? (
            <BillingPortalButton
              label="Atualizar pagamento no portal"
              returnUrl="/assinatura/bloqueada"
            />
          ) : null}

          {showCheckoutCta ? (
            <Link
              href="/assinar"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Reativar assinatura
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
