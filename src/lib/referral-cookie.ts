export const REFERRAL_COOKIE_NAME = "receps_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function shouldUseSecureCookie() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.protocol === "https:";
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : null;
}

export function setReferralCookie(ref: string) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = ref.trim();

  if (!normalized) {
    clearReferralCookie();
    return;
  }

  document.cookie = [
    `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}`,
    "path=/",
    `max-age=${REFERRAL_COOKIE_MAX_AGE}`,
    "samesite=lax",
    shouldUseSecureCookie() ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function getReferralCookie() {
  return readCookie(REFERRAL_COOKIE_NAME);
}

export function clearReferralCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${REFERRAL_COOKIE_NAME}=`,
    "path=/",
    "max-age=0",
    "samesite=lax",
    shouldUseSecureCookie() ? "secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
