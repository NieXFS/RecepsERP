"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const META_SDK_SRC = "https://connect.facebook.net/pt_BR/sdk.js";
const META_SDK_VERSION = "v21.0";
const ALLOWED_META_ORIGINS = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
]);

type MetaConnectStatus = "idle" | "connecting" | "success" | "error";

type EmbeddedSignupFinishData = {
  wabaId: string;
  phoneNumberId: string;
};

type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  } | null;
} | null;

type FacebookLoginOptions = {
  config_id: string;
  response_type: "code";
  override_default_response_type: true;
  extras: {
    sessionInfoVersion: "3";
  };
};

type FacebookSdk = {
  init: (params: { appId: string; version: string; xfbml: boolean }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void | Promise<void>,
    options: FacebookLoginOptions
  ) => void;
};

type EmbeddedSignupMessage = {
  type?: unknown;
  event?: unknown;
  data?: {
    phone_number_id?: unknown;
    waba_id?: unknown;
  };
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: (() => void) | undefined;
  }
}

function parseEmbeddedSignupMessage(rawData: unknown): EmbeddedSignupMessage | null {
  let data = rawData;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return data as EmbeddedSignupMessage;
}

async function waitForSignupData(
  ref: MutableRefObject<EmbeddedSignupFinishData | null>,
  timeoutMs: number = 4_000
) {
  if (ref.current) {
    return ref.current;
  }

  const startedAt = Date.now();

  return new Promise<EmbeddedSignupFinishData | null>((resolve) => {
    const interval = window.setInterval(() => {
      if (ref.current) {
        window.clearInterval(interval);
        resolve(ref.current);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

export function MetaConnectButton({
  appId,
  configId,
  enabled,
  alreadyConnected,
  onConnected,
}: {
  appId: string;
  configId: string;
  enabled: boolean;
  alreadyConnected: boolean;
  onConnected?: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<MetaConnectStatus>("idle");
  const [, setCapturedSignupData] = useState<EmbeddedSignupFinishData | null>(null);
  const capturedSignupDataRef = useRef<EmbeddedSignupFinishData | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const initializeFacebookSdk = () => {
      if (!window.FB || !appId) {
        return;
      }

      window.FB.init({
        appId,
        version: META_SDK_VERSION,
        xfbml: false,
      });
    };

    const previousFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      initializeFacebookSdk();
      previousFbAsyncInit?.();
    };

    if (window.FB) {
      initializeFacebookSdk();
    }

    const handleMessage = (event: MessageEvent) => {
      if (!ALLOWED_META_ORIGINS.has(event.origin)) {
        return;
      }

      const payload = parseEmbeddedSignupMessage(event.data);

      if (!payload || payload.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      if (payload.event !== "FINISH") {
        return;
      }

      const wabaId =
        typeof payload.data?.waba_id === "string" ? payload.data.waba_id.trim() : "";
      const phoneNumberId =
        typeof payload.data?.phone_number_id === "string"
          ? payload.data.phone_number_id.trim()
          : "";

      if (!wabaId || !phoneNumberId) {
        return;
      }

      const nextData = { wabaId, phoneNumberId };
      capturedSignupDataRef.current = nextData;
      setCapturedSignupData(nextData);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.fbAsyncInit = previousFbAsyncInit;
    };
  }, [appId, enabled]);

  if (!enabled) {
    return null;
  }

  async function handleConnectClick() {
    if (!appId || !configId) {
      setStatus("error");
      toast.error("Integração Meta indisponível. Verifique a configuração.");
      return;
    }

    if (!window.FB) {
      setStatus("error");
      toast.error("A integração com o Facebook ainda está carregando. Tente novamente.");
      return;
    }

    capturedSignupDataRef.current = null;
    setCapturedSignupData(null);
    setStatus("connecting");

    window.FB.login(
      async (response) => {
        const code = response?.authResponse?.code?.trim();

        if (!code) {
          setStatus("error");
          toast.error("Falha ao conectar. Tente novamente.");
          return;
        }

        const capturedData = await waitForSignupData(capturedSignupDataRef);

        if (!capturedData?.wabaId || !capturedData.phoneNumberId) {
          setStatus("error");
          toast.error("Falha ao conectar. Tente novamente.");
          return;
        }

        try {
          const res = await fetch("/api/meta/embedded-signup/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              wabaId: capturedData.wabaId,
              phoneNumberId: capturedData.phoneNumberId,
            }),
          });

          const payload = (await res.json().catch(() => null)) as
            | { error?: string; success?: boolean }
            | null;

          if (!res.ok || !payload?.success) {
            setStatus("error");
            toast.error(payload?.error || "Falha ao conectar. Tente novamente.");
            return;
          }

          setStatus("success");
          toast.success(
            alreadyConnected
              ? "WhatsApp reconectado com sucesso."
              : "WhatsApp conectado com sucesso."
          );
          onConnected?.();
          router.refresh();
        } catch {
          setStatus("error");
          toast.error("Falha ao conectar. Tente novamente.");
        }
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: "3",
        },
      }
    );
  }

  const label =
    status === "connecting"
      ? "Conectando..."
      : alreadyConnected
        ? "Desconectar e reconectar"
        : "Conectar WhatsApp";

  return (
    <>
      <Script
        id="meta-embedded-signup-sdk"
        src={META_SDK_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          window.fbAsyncInit?.();
        }}
      />

      <Button
        variant={alreadyConnected ? "outline" : "default"}
        className="gap-2"
        disabled={status === "connecting"}
        onClick={handleConnectClick}
      >
        {status === "connecting" && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {label}
      </Button>
    </>
  );
}
