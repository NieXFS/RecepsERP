"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { COOKIE_CONSENT_NAME } from "@/components/marketing/cookie-consent-banner";
import { trackEvent } from "@/lib/analytics/events";

function canLoadAnalytics() {
  if (typeof window === "undefined") {
    return false;
  }

  const enabled =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

  if (!enabled) {
    return false;
  }

  return document.cookie.includes(`${COOKIE_CONSENT_NAME}=accepted`);
}

function ensureGa() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  if (!measurementId || document.getElementById("receps-ga-script")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "receps-ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

function ensureMetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  if (!pixelId || document.getElementById("receps-meta-pixel")) {
    return;
  }

  window.fbq =
    window.fbq ||
    function fbq(...args: unknown[]) {
      (window.fbq as unknown as { queue?: unknown[][] }).queue =
        (window.fbq as unknown as { queue?: unknown[][] }).queue || [];
      (window.fbq as unknown as { queue?: unknown[][] }).queue?.push(args);
    };

  const script = document.createElement("script");
  script.id = "receps-meta-pixel";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", pixelId);
}

export function AnalyticsScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>("");

  useEffect(() => {
    if (!canLoadAnalytics()) {
      return;
    }

    ensureGa();
    ensureMetaPixel();
  }, []);

  useEffect(() => {
    if (!canLoadAnalytics()) {
      return;
    }

    const pathWithQuery = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (previousPathRef.current === pathWithQuery) {
      return;
    }

    previousPathRef.current = pathWithQuery;
    trackEvent("page_view", { path: pathWithQuery });
  }, [pathname, searchParams]);

  return null;
}
