"use client";

import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { AnaAvatar } from "./ana-avatar";

const DEMO_CLIENT_MESSAGE = "Oi, quero marcar um horário 😊";
const DEMO_TIME = "10:24";

export function AnaWhatsAppPreview({
  botName,
  greetingMessage,
  fallbackMessage,
  whatsappConnected,
}: {
  botName: string;
  greetingMessage: string;
  fallbackMessage: string;
  whatsappConnected: boolean;
}) {
  const displayName = botName.trim() || "Ana";
  const greeting = greetingMessage.trim() || "Digite a mensagem de boas-vindas pra ver aqui.";
  const fallback = fallbackMessage.trim();
  const time = DEMO_TIME;

  return (
    <div
      aria-label="Pré-visualização de como a Ana aparece no WhatsApp"
      className="mx-auto w-full max-w-[300px]"
    >
      <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-neutral-900 p-2 shadow-xl shadow-black/10">
        <div className="relative flex h-[520px] flex-col overflow-hidden rounded-[24px] bg-white dark:bg-neutral-900">
          {/* Header estilo WhatsApp */}
          <header className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5 text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <AnaAvatar isActive={whatsappConnected} size="sm" />
            <div className="flex-1 leading-tight">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-[10px] opacity-80">
                {whatsappConnected ? "online" : "aguardando ativação"}
              </p>
            </div>
            <Video className="h-4 w-4 opacity-90" aria-hidden="true" />
            <Phone className="h-4 w-4 opacity-90" aria-hidden="true" />
            <MoreVertical className="h-4 w-4 opacity-90" aria-hidden="true" />
          </header>

          {/*
            Cores #ECE5DD (light) e #0B141A (dark) são as cores nativas do wallpaper
            do WhatsApp — mantemos hex fixo aqui pra preservar o realismo do mockup.
          */}
          <div className="relative flex-1 overflow-hidden bg-[#ECE5DD] px-3 py-4 dark:bg-[#0B141A]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_20%_20%,#000_1px,transparent_1px),radial-gradient(circle_at_80%_70%,#000_1px,transparent_1px)] [background-size:24px_24px]"
            />
            <div className="relative flex flex-col gap-2.5">
              <ChatBubble side="in">{DEMO_CLIENT_MESSAGE}</ChatBubble>
              <ChatBubble side="out" time={time}>
                {greeting}
              </ChatBubble>
              {fallback && (
                <>
                  <ChatBubble side="in">Hmm, e se eu quiser algo diferente?</ChatBubble>
                  <ChatBubble side="out" time={time}>
                    {fallback}
                  </ChatBubble>
                </>
              )}
            </div>
          </div>

          {/* Footer fake */}
          <div className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2 text-xs text-neutral-500 dark:border-white/10 dark:bg-neutral-900">
            <div className="flex-1 rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-400 dark:bg-neutral-800">
              Digite uma mensagem
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Assim seus clientes vão ver as mensagens da {displayName}.
      </p>
    </div>
  );
}

function ChatBubble({
  side,
  children,
  time,
}: {
  side: "in" | "out";
  children: React.ReactNode;
  time?: string;
}) {
  if (side === "in") {
    return (
      <div className="max-w-[75%] self-start rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-relaxed text-neutral-800 shadow-sm dark:bg-neutral-800 dark:text-neutral-100">
        {children}
      </div>
    );
  }
  return (
    <div className="max-w-[82%] self-end rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 text-[13px] leading-relaxed text-neutral-800 shadow-sm dark:bg-[#005C4B] dark:text-neutral-50">
      <p className="whitespace-pre-wrap break-words">{children}</p>
      {time && (
        <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500 dark:text-neutral-300/80">
          {time}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 11"
            className="h-3 w-3 fill-[#34B7F1]"
          >
            <path d="M11.071.653a.5.5 0 0 1 .054.704l-6 7a.5.5 0 0 1-.735.032l-3-3a.5.5 0 1 1 .708-.707l2.619 2.619 5.65-6.593a.5.5 0 0 1 .704-.055Z" />
            <path d="M15.071.653a.5.5 0 0 1 .054.704l-6 7a.5.5 0 0 1-.735.032l-.75-.75a.5.5 0 1 1 .708-.707l.374.374 5.65-6.593a.5.5 0 0 1 .7-.06Z" />
          </svg>
        </span>
      )}
    </div>
  );
}
