import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, LockKeyhole } from "lucide-react";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthUser } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/subscription-guard";

function getStatusLabel(status: string) {
  return (
    {
      TRIALING: "Trial",
      ACTIVE: "Assinatura ativa",
      PAST_DUE: "Pagamento pendente",
      CANCELED: "Assinatura cancelada",
      INCOMPLETE: "Pagamento inicial incompleto",
      INCOMPLETE_EXPIRED: "Pagamento expirado",
      UNPAID: "Inadimplente",
      PAUSED: "Pausada",
      NONE: "Sem assinatura",
    }[status] ?? status
  );
}

export default async function SubscriptionBlockedPage() {
  const user = await getAuthUser();
  const status = await getSubscriptionStatus(user.tenantId);

  if (status.hasAccess) {
    redirect("/dashboard");
  }

  const showPortalCta = ["PAST_DUE", "UNPAID", "INCOMPLETE"].includes(status.status);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,#172554,transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="w-full max-w-3xl border-border/70 bg-background/95 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardContent className="space-y-8 p-8 md:p-10">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <div className="space-y-3">
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  Acesso ao ERP bloqueado
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Este tenant precisa de uma assinatura válida para continuar usando o Receps ERP.
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Enquanto a assinatura não estiver ativa, em trial, ou liberada manualmente pela
                  Receps, o acesso às áreas internas do ERP fica totalmente bloqueado.
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-5 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">Status atual</p>
                <p className="text-lg font-semibold">{getStatusLabel(status.status)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Motivo</p>
                <p className="text-sm leading-6 text-muted-foreground">{status.reason}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button render={<Link href="/assinar" />} size="lg" className="min-w-52">
                <CreditCard className="h-4 w-4" />
                Ativar assinatura
              </Button>

              {showPortalCta ? (
                <BillingPortalButton
                  label="Atualizar pagamento"
                  returnUrl="/assinatura/bloqueada"
                  variant="outline"
                  className="min-w-52"
                />
              ) : null}

              <Button render={<Link href="/logout" />} variant="ghost" size="lg">
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
