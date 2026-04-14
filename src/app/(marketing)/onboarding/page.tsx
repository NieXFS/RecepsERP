import { notFound } from "next/navigation";
import { OnboardingStatusCard } from "@/components/billing/onboarding-status-card";
import { db } from "@/lib/db";
import { getCheckoutSession } from "@/services/billing.service";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(value);
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id) {
    notFound();
  }

  let checkoutSession;

  try {
    checkoutSession = await getCheckoutSession(params.session_id);
  } catch {
    notFound();
  }

  const tenantId =
    checkoutSession.client_reference_id ?? checkoutSession.metadata?.tenantId ?? null;

  if (!tenantId) {
    notFound();
  }

  const subscription = await db.subscription.findUnique({
    where: { tenantId },
    select: {
      id: true,
      trialEnd: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <OnboardingStatusCard
        mode={subscription ? "success" : "waiting"}
        trialEndsAt={subscription?.trialEnd ? formatDate(subscription.trialEnd) : null}
      />
    </div>
  );
}
