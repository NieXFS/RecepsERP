import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubscriptionStatus as getBillingSubscriptionStatus } from "@/services/billing.service";

const ALWAYS_ACCESSIBLE_PATH_PREFIXES = [
  "/assinar",
  "/assinatura/bloqueada",
  "/cadastro",
  "/logout",
  "/onboarding",
] as const;

function isAlwaysAccessiblePath(pathname: string) {
  return ALWAYS_ACCESSIBLE_PATH_PREFIXES.some((prefix) =>
    pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)
  );
}

export async function getSubscriptionStatus(tenantId: string) {
  return getBillingSubscriptionStatus(tenantId);
}

export async function enforceSubscriptionAccess(user: {
  tenantId: string;
  globalRole: string | null;
}) {
  if (user.globalRole === "SUPER_ADMIN") {
    return {
      hasAccess: true,
      status: "ACTIVE" as const,
      reason: "Super admin global com bypass de billing.",
      accessSource: "SUPER_ADMIN" as const,
      billingBypassEnabled: false,
      billingBypassReason: null,
      billingBypassUpdatedAt: null,
    };
  }

  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-receps-pathname") ?? "";
  const subscriptionStatus = await getSubscriptionStatus(user.tenantId);

  if (subscriptionStatus.hasAccess || isAlwaysAccessiblePath(pathname)) {
    return subscriptionStatus;
  }

  const params = new URLSearchParams({
    status: subscriptionStatus.status,
    reason: subscriptionStatus.reason,
  });

  redirect(`/assinatura/bloqueada?${params.toString()}`);
}
