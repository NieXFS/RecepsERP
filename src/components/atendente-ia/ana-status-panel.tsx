"use client";

import { MessageCircle, PlayCircle, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  maskPhoneNumberId,
  META_CONNECTION_SOURCES,
  type MetaConnectionSource,
} from "@/lib/bot-config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MetaConnectButton } from "./meta-connect-button";

const SUPPORT_CONNECT_MESSAGE =
  "Olá, gostaria de conectar um número WhatsApp à minha atendente Ana no Receps.";

function getSupportUrl() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER?.trim();
  if (!number) return null;
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", SUPPORT_CONNECT_MESSAGE);
  return url.toString();
}

const STATS: Array<{ id: string; label: string; value: string }> = [
  { id: "messages", label: "Mensagens hoje", value: "—" },
  { id: "bookings", label: "Agendamentos pela Ana", value: "—" },
  { id: "response", label: "Tempo médio de resposta", value: "—" },
];

export function AnaStatusPanel({
  whatsappConnected,
  phoneNumberId,
  metaConnectionSource,
  metaConnectedAt,
  embeddedSignupEnabled,
  metaAppId,
  metaConfigId,
}: {
  whatsappConnected: boolean;
  phoneNumberId: string | null;
  metaConnectionSource: MetaConnectionSource | null;
  metaConnectedAt: string | null;
  embeddedSignupEnabled: boolean;
  metaAppId: string;
  metaConfigId: string;
}) {
  const supportUrl = getSupportUrl();
  const embeddedSignupConnected =
    metaConnectionSource === META_CONNECTION_SOURCES.EMBEDDED_SIGNUP &&
    Boolean(phoneNumberId);
  const manualConnectionActive = whatsappConnected && !embeddedSignupConnected;
  const formattedConnectedAt = metaConnectedAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
        new Date(metaConnectedAt)
      )
    : null;

  const panelTitle = whatsappConnected ? "Ana está ativa" : "Aguardando ativação";
  const panelDescription = embeddedSignupEnabled
    ? embeddedSignupConnected
      ? "Seu número já foi autorizado pela Meta e está pronto para atender."
      : manualConnectionActive
        ? "Seu número segue ativo, mas você já pode substituir essa conexão pelo fluxo oficial da Meta."
        : "Conecte o WhatsApp da sua empresa em poucos cliques pelo Facebook."
    : whatsappConnected
      ? "A Ana já está respondendo mensagens no seu número."
      : "O suporte precisa conectar seu número WhatsApp pra ela começar.";

  return (
    <div className="space-y-5 rounded-2xl border border-primary/10 bg-card/70 p-5 backdrop-blur-sm ring-1 ring-primary/5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
            whatsappConnected && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          )}
        >
          <Radio className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                whatsappConnected
                  ? "animate-pulse bg-emerald-500"
                  : "bg-amber-500"
              )}
            />
            <h3 className="font-heading text-sm font-semibold leading-tight">
              {panelTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {panelDescription}
          </p>
          {whatsappConnected && phoneNumberId && (
            <Badge variant="outline" className="mt-2">
              {maskPhoneNumberId(phoneNumberId)}
            </Badge>
          )}
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        {STATS.map((stat) => (
          <div
            key={stat.id}
            className="rounded-xl border border-border/70 bg-background/60 p-3"
          >
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="mt-1.5 flex items-baseline justify-between gap-1">
              <span className="font-heading text-base font-semibold tabular-nums">
                {stat.value}
              </span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                em breve
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2 border-t border-border/60 pt-4">
        {embeddedSignupEnabled ? (
          embeddedSignupConnected && phoneNumberId ? (
            <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">WhatsApp conectado</p>
                  <p className="text-xs text-muted-foreground">
                    {maskPhoneNumberId(phoneNumberId)}
                  </p>
                  {formattedConnectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Conectado em {formattedConnectedAt}
                    </p>
                  )}
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Meta
                </Badge>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Se quiser trocar a conta ou o número conectado, você pode refazer a
                autorização e substituir a conexão atual.
              </p>

              <MetaConnectButton
                appId={metaAppId}
                configId={metaConfigId}
                enabled={embeddedSignupEnabled}
                alreadyConnected
              />
            </div>
          ) : manualConnectionActive && phoneNumberId ? (
            <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">WhatsApp ativo via configuração manual</p>
                  <p className="text-xs text-muted-foreground">
                    {maskPhoneNumberId(phoneNumberId)}
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
                  Manual
                </Badge>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Seu número continua funcionando normalmente. Se preferir, reconecte
                agora pelo fluxo Embedded Signup para substituir as credenciais salvas
                manualmente.
              </p>

              <MetaConnectButton
                appId={metaAppId}
                configId={metaConfigId}
                enabled={embeddedSignupEnabled}
                alreadyConnected
              />
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="space-y-1">
                <p className="font-heading text-base font-semibold">
                  Conecte o WhatsApp do seu negócio pra começar
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Autorize a Receps pela Meta e a conexão do seu número será salva
                  automaticamente.
                </p>
              </div>

              <MetaConnectButton
                appId={metaAppId}
                configId={metaConfigId}
                enabled={embeddedSignupEnabled}
                alreadyConnected={false}
              />
            </div>
          )
        ) : null}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  disabled
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Testar conversa
                </Button>
              }
            />
            <TooltipContent side="top">
              Playground de conversas chegando em breve.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!embeddedSignupEnabled && !whatsappConnected && supportUrl && (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Falar com o suporte pra conectar o WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
