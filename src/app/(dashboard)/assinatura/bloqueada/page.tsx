import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthUser } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/subscription-guard";

export default async function SubscriptionBlockedPage() {
  const user = await getAuthUser();
  const status = await getSubscriptionStatus(user.tenantId);

  if (status.hasAccess) {
    redirect("/dashboard");
  }

  const showPortalCta = ["PAST_DUE", "UNPAID", "INCOMPLETE"].includes(status.status);
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e2e8f0,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,#1e293b,transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <Card className="w-full max-w-3xl border-border/70 bg-background/95 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                Acesso bloqueado
              </Badge>
              <CardTitle className="text-3xl tracking-tight">
                Este tenant precisa de uma assinatura para usar o ERP
              </CardTitle>
              <CardDescription className="mx-auto max-w-2xl text-sm leading-6">
                O acesso fica liberado apenas com assinatura em trial ou ativa, ou com uma
                liberação manual da Receps.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-center">
              <p className="text-sm font-medium">Status atual</p>
              <p className="mt-2 text-lg font-semibold">{status.status}</p>
              <p className="mt-2 text-sm text-muted-foreground">{status.reason}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/assinar"
                className="inline-flex h-10 min-w-52 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Ativar assinatura
              </Link>

              {showPortalCta ? (
                <BillingPortalButton
                  label="Atualizar pagamento"
                  returnUrl="/assinatura/bloqueada"
                  variant="outline"
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
