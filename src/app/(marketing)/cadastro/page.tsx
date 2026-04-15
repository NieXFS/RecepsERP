import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignupAutostart } from "@/components/auth/signup-autostart";
import { SignupForm } from "@/components/auth/signup-form";
import {
  SignupMobileHeader,
  SignupPayoffPanel,
} from "@/components/auth/signup-payoff-panel";
import { ForceLightTheme } from "@/components/marketing/force-light-theme";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral-cookie";
import { getOptionalSession } from "@/lib/session";
import { getActivePlanBySlug, getSubscriptionStatus } from "@/services/billing.service";
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

  const resolvedPlan = {
    slug: plan.slug,
    name: plan.name,
    priceMonthly: Number(plan.priceMonthly),
    currency: plan.currency,
    trialDays: plan.trialDays,
  };

  if (session) {
    const access = await getSubscriptionStatus(session.tenantId);

    if (access.hasAccess) {
      redirect("/configuracoes/assinatura?notice=already-active");
    }

    if (!["NONE", "CANCELED", "INCOMPLETE_EXPIRED"].includes(access.status)) {
      redirect("/configuracoes/assinatura?notice=billing-in-progress");
    }
  }

  return (
    <>
      <ForceLightTheme />

      <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_24%,#ffffff_100%)] text-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-14">
          {session ? (
            <div className="mx-auto max-w-3xl py-10">
              <SignupAutostart
                planId={plan.id}
                planSlug={plan.slug}
                planName={plan.name}
                referralCode={referral?.code}
              />
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-0">
              <div className="lg:hidden">
                <SignupMobileHeader plan={resolvedPlan} />
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-stretch">
                <SignupPayoffPanel plan={resolvedPlan} />

                <div className="lg:py-4">
                  <SignupForm
                    plan={resolvedPlan}
                    referralCode={referral?.code}
                    referralTenantName={referral?.tenant.name ?? null}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
