import { ReferralShareActions } from "@/components/billing/referral-share-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserWithAccess } from "@/lib/session";
import { getReferralDashboardData } from "@/services/referral.service";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(value);
}

export default async function ReferralSettingsPage() {
  const user = await getAuthUserWithAccess();
  const referralData = await getReferralDashboardData(user.tenantId);

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Programa de indicações</CardTitle>
          <CardDescription>
            O convidado ganha 15% OFF na primeira cobrança real e os rewards de 40% entram em
            fila mensal, sem empilhar na mesma invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralShareActions
            code={referralData.code}
            shareUrl={referralData.shareUrl}
            tenantName={referralData.referral.tenant.name}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total indicados" value={String(referralData.metrics.totalInvited)} />
        <MetricCard
          label="Total convertidos"
          value={String(referralData.metrics.totalConverted)}
        />
        <MetricCard
          label="Rewards pendentes"
          value={String(referralData.metrics.pendingRewards)}
        />
        <MetricCard
          label="Rewards aplicados"
          value={String(referralData.metrics.appliedRewards)}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de rewards</CardTitle>
          <CardDescription>Fila FIFO e aplicação por ciclo elegível.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {referralData.referral.rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum reward gerado até o momento.
            </p>
          ) : (
            referralData.referral.rewards.map((reward) => (
              <div
                key={reward.id}
                className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[0.9fr_0.7fr_0.8fr_0.8fr]"
              >
                <InfoItem
                  label="Indicado"
                  value={reward.referredTenant.name}
                />
                <InfoItem label="Status" value={reward.status} />
                <InfoItem
                  label="Desconto"
                  value={`${reward.discountPercent}%`}
                />
                <InfoItem
                  label="Criado em"
                  value={formatDate(reward.createdAt)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-2 py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
