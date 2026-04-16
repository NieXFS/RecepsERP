"use client";

import { COOKIE_CONSENT_NAME } from "@/components/marketing/cookie-consent-banner";

export type AnalyticsEventName =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "plan_selected"
  | "trial_started"
  | "payment_method_added"
  | "first_service_created"
  | "first_appointment_created"
  | "subscription_active";

type AnalyticsPayloadMap = {
  page_view: { path?: string };
  signup_started: Record<string, never>;
  signup_completed: Record<string, never>;
  plan_selected: { plan_slug: string };
  trial_started: { plan_slug: string; value: number; currency: "BRL" };
  payment_method_added: { plan_slug: string };
  first_service_created: { segment: string };
  first_appointment_created: Record<string, never>;
  subscription_active: { plan_slug: string; value: number; currency: "BRL" };
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function canTrackClient() {
  if (typeof window === "undefined") {
    return false;
  }

  const analyticsEnabled =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

  if (!analyticsEnabled) {
    return false;
  }

  return document.cookie.includes(`${COOKIE_CONSENT_NAME}=accepted`);
}

function createEventId(name: AnalyticsEventName) {
  return `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload?: AnalyticsPayloadMap[Name],
  options?: { eventId?: string }
) {
  if (!canTrackClient()) {
    return null;
  }

  const eventId = options?.eventId ?? createEventId(name);
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload ?? {}).filter(([, value]) => value !== undefined)
  );

  if (typeof window.gtag === "function") {
    window.gtag("event", name, {
      ...normalizedPayload,
      event_id: eventId,
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", name, normalizedPayload, {
      eventID: eventId,
    });
  }

  return eventId;
}
