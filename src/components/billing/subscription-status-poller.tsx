"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type SubscriptionStatusPollerProps = {
  enabled?: boolean;
  intervalMs?: number;
  maxDurationMs?: number;
};

export function SubscriptionStatusPoller({
  enabled = true,
  intervalMs = 3000,
  maxDurationMs = 5 * 60 * 1000,
}: SubscriptionStatusPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, maxDurationMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [enabled, intervalMs, maxDurationMs, router]);

  return null;
}
