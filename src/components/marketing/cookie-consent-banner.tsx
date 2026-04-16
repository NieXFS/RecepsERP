"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const COOKIE_CONSENT_NAME = "receps_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getCookieValue(name: string) {
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

function setCookieValue(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieValue(COOKIE_CONSENT_NAME);
    setVisible(consent !== "accepted");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-4 md:max-w-md">
      <div className="rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur">
        <p className="text-sm font-semibold">Usamos cookies para melhorar sua experiência.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Os cookies necessários mantêm o site funcionando. Cookies analíticos e de
          marketing só são ativados com seu consentimento.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="sm:flex-1"
            onClick={() => {
              setCookieValue(COOKIE_CONSENT_NAME, "accepted");
              setVisible(false);
            }}
          >
            Aceitar
          </Button>
          <Button render={<Link href="/privacidade#cookies" />} variant="outline" size="lg">
            Saiba mais
          </Button>
        </div>
      </div>
    </div>
  );
}
