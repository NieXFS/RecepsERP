import crypto from "node:crypto";
import { getAppUrl } from "@/lib/stripe";

type ServerAnalyticsEventName =
  | "trial_started"
  | "payment_method_added"
  | "first_service_created"
  | "first_appointment_created"
  | "subscription_active";

type ServerAnalyticsPayload = {
  eventName: ServerAnalyticsEventName;
  tenantId: string;
  email?: string | null;
  eventSourceUrl: string;
  eventId?: string;
  customData?: Record<string, unknown>;
};

function isServerAnalyticsEnabled() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true"
  );
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function postMetaEvent(payload: ServerAnalyticsPayload) {
  const datasetId = process.env.META_CONVERSIONS_API_DATASET_ID?.trim();
  const token = process.env.META_CONVERSIONS_API_TOKEN?.trim();

  if (!datasetId || !token) {
    return;
  }

  await fetch(`https://graph.facebook.com/v19.0/${datasetId}/events?access_token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          event_name: payload.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: payload.eventId,
          action_source: "website",
          event_source_url: payload.eventSourceUrl,
          user_data: {
            em: payload.email ? [sha256(payload.email)] : undefined,
            external_id: sha256(payload.tenantId),
          },
          custom_data: payload.customData,
        },
      ],
    }),
  });
}

async function postGaEvent(payload: ServerAnalyticsPayload) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA4_API_SECRET?.trim();

  if (!measurementId || !apiSecret) {
    return;
  }

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: payload.tenantId,
        events: [
          {
            name: payload.eventName,
            params: {
              ...payload.customData,
              event_id: payload.eventId,
            },
          },
        ],
      }),
    }
  );
}

export async function trackServerEvent(payload: ServerAnalyticsPayload) {
  if (!isServerAnalyticsEnabled()) {
    return;
  }

  const eventId =
    payload.eventId ??
    `${payload.eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  await Promise.allSettled([
    postMetaEvent({ ...payload, eventId }),
    postGaEvent({ ...payload, eventId }),
  ]);
}

export function buildAppEventUrl(path: string) {
  return `${getAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
