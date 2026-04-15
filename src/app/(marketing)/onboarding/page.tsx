import { notFound, redirect } from "next/navigation";
import { OnboardingStatusCard } from "@/components/billing/onboarding-status-card";
import { db } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";
import { getCheckoutSession, getSubscriptionStatus } from "@/services/billing.service";

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
  const session = await getOptionalSession();

  if (!params.session_id) {
    if (!session) {
      notFound();
    }

    const [subscription, access] = await Promise.all([
      db.subscription.findUnique({
        where: { tenantId: session.tenantId },
        select: {
          id: true,
          trialEnd: true,
        },
      }),
      getSubscriptionStatus(session.tenantId),
    ]);

    const mode = access.hasAccess
      ? "success"
      : access.shouldPoll
        ? "waiting"
        : "failed";

    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <OnboardingStatusCard
          mode={mode}
          trialEndsAt={subscription?.trialEnd ? formatDate(subscription.trialEnd) : null}
          message={mode === "waiting" ? access.reason : access.reason}
        />
      </div>
    );
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

  if (!session) {
    redirect("/login");
  }

  const subscription = await db.subscription.findUnique({
    where: { tenantId },
    select: {
      id: true,
      trialEnd: true,
    },
  });
  const access = await getSubscriptionStatus(tenantId);
  const checkoutCreatedAt = new Date(checkoutSession.created * 1000);
  const isRecentCheckout = Date.now() - checkoutCreatedAt.getTime() <= 5 * 60 * 1000;
  const mode = access.hasAccess
    ? "success"
    : !subscription && isRecentCheckout
      ? "waiting"
      : access.shouldPoll
        ? "waiting"
        : "failed";
  const waitingMessage =
    !subscription && isRecentCheckout
      ? "Estamos confirmando o seu pagamento. Isso costuma levar só alguns instantes."
      : access.reason;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <OnboardingStatusCard
        mode={mode}
        trialEndsAt={subscription?.trialEnd ? formatDate(subscription.trialEnd) : null}
        message={mode === "waiting" ? waitingMessage : access.reason}
      />
    </div>
  );
}
