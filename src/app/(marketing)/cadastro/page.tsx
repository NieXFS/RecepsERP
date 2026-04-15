import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getOptionalSession } from "@/lib/session";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral-cookie";
import { createCheckoutSession, getActivePlanBySlug, getSubscriptionStatus } from "@/services/billing.service";
import { getReferralByCode } from "@/services/referral.service";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; ref?: string }>;
}) {
  const params = await searchParams;
  const planSlug = params.plan?.trim();

  if (!planSlug) {
    redirect("/assinar");
  }

  const cookieStore = await cookies();
  const referralCandidate = params.ref?.trim() || cookieStore.get(REFERRAL_COOKIE_NAME)?.value;

  const [session, plan, referral] = await Promise.all([
    getOptionalSession(),
    getActivePlanBySlug(planSlug),
    referralCandidate ? getReferralByCode(referralCandidate) : null,
  ]);

  if (!plan) {
    redirect("/assinar");
  }

  if (session) {
    const access = await getSubscriptionStatus(session.tenantId);

    if (access.hasAccess) {
      redirect("/configuracoes/assinatura?notice=already-active");
    }

    if (!["NONE", "CANCELED", "INCOMPLETE_EXPIRED"].includes(access.status)) {
      redirect("/configuracoes/assinatura?notice=billing-in-progress");
    }

    try {
      const checkoutSession = await createCheckoutSession({
        tenantId: session.tenantId,
        planId: plan.id,
        referralCode: referral?.code ?? undefined,
        customerEmail: session.email,
      });

      if (checkoutSession.url) {
        redirect(checkoutSession.url);
      }
    } catch {
      redirect("/configuracoes/assinatura?notice=checkout-error");
    }

    redirect("/assinar");
  }

  return (
    <SignupForm
      plan={{
        slug: plan.slug,
        name: plan.name,
        priceMonthly: Number(plan.priceMonthly),
        currency: plan.currency,
        trialDays: plan.trialDays,
      }}
      referralCode={referral?.code}
      referralTenantName={referral?.tenant.name ?? null}
    />
  );
}
