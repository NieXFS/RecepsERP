import { differenceInCalendarDays } from "date-fns";
import { db } from "@/lib/db";
import { TrialStatusBannerClient } from "@/components/billing/trial-status-banner-client";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(value);
}

export async function TrialStatusBanner({ tenantId }: { tenantId: string }) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscription: {
        select: {
          status: true,
          trialEnd: true,
          defaultPaymentMethod: true,
        },
      },
    },
  });

  const subscription = tenant?.subscription;

  if (!subscription || subscription.status !== "TRIALING" || !subscription.trialEnd) {
    return null;
  }

  const daysRemaining = Math.max(0, differenceInCalendarDays(subscription.trialEnd, new Date()));
  const hasPaymentMethod = Boolean(subscription.defaultPaymentMethod);

  if (!hasPaymentMethod && daysRemaining > 3) {
    return null;
  }

  return (
    <TrialStatusBannerClient
      daysRemaining={daysRemaining}
      hasPaymentMethod={hasPaymentMethod}
      trialEndFormatted={formatDate(subscription.trialEnd)}
    />
  );
}
