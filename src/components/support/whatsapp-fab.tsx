"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type WhatsAppFabProps = {
  prefilledMessage?: string;
};

const HIDDEN_PATHS = new Set([
  "/bem-vindo",
  "/login",
  "/cadastro",
  "/assinatura/bloqueada",
]);

function getSupportUrl(prefilledMessage?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER?.trim();

  if (!number) {
    return null;
  }

  const url = new URL(`https://wa.me/${number}`);

  if (prefilledMessage?.trim()) {
    url.searchParams.set("text", prefilledMessage.trim());
  }

  return url.toString();
}

export function WhatsAppFab({ prefilledMessage }: WhatsAppFabProps) {
  const pathname = usePathname();
  const [animatePulse, setAnimatePulse] = useState(false);
  const href = getSupportUrl(prefilledMessage);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setAnimatePulse(true);
    const timeout = window.setTimeout(() => setAnimatePulse(false), 2600);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!href || HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o suporte do Receps no WhatsApp"
      className={[
        "group fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-[0_20px_50px_rgba(37,211,102,0.35)] transition-transform",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "md:bottom-6 md:right-6",
        pathname.startsWith("/dashboard") || pathname.startsWith("/agenda") || pathname.startsWith("/clientes") || pathname.startsWith("/financeiro") || pathname.startsWith("/configuracoes")
          ? "bottom-20"
          : "",
        animatePulse ? "animate-[pulse_1.8s_ease-in-out_2]" : "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute right-16 hidden rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-lg transition-opacity group-hover:block">
        Falar com a gente
      </span>
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-7 w-7 fill-current"
      >
        <path d="M19.11 17.24c-.27-.14-1.59-.79-1.84-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.16-.42-2.2-1.35-.81-.72-1.36-1.6-1.52-1.87-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.28 0 1.34.98 2.64 1.11 2.82.14.18 1.91 2.91 4.63 4.08.65.28 1.16.44 1.56.56.65.21 1.24.18 1.71.11.52-.08 1.59-.65 1.82-1.28.23-.63.23-1.16.16-1.28-.07-.11-.25-.18-.52-.32Z" />
        <path d="M16.03 3.2c-7.05 0-12.77 5.72-12.77 12.77 0 2.25.59 4.46 1.71 6.41L3 29l6.8-1.78a12.8 12.8 0 0 0 6.23 1.6h.01c7.05 0 12.77-5.72 12.77-12.77S23.08 3.2 16.03 3.2Zm0 23.45h-.01a10.65 10.65 0 0 1-5.43-1.49l-.39-.23-4.04 1.06 1.08-3.94-.25-.4a10.62 10.62 0 0 1-1.64-5.6c0-5.87 4.79-10.65 10.68-10.65 2.85 0 5.53 1.11 7.54 3.11 2.01 2.01 3.12 4.69 3.12 7.54 0 5.88-4.78 10.66-10.66 10.66Z" />
      </svg>
    </a>
  );
}
