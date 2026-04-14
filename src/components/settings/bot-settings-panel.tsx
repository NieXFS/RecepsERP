"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Clock3, MessageSquareText, Save } from "lucide-react";
import { toast } from "sonner";
import { updateBotConfigAction } from "@/actions/bot-config.actions";
import { BOT_TIMEZONE_OPTIONS, maskPhoneNumberId } from "@/lib/bot-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BotSettingsRecord } from "@/services/bot-config.service";

const timezoneOptions = BOT_TIMEZONE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function BotSettingsPanel({
  settings,
}: {
  settings: BotSettingsRecord;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [botName, setBotName] = useState(settings.botName);
  const [greetingMessage, setGreetingMessage] = useState(settings.greetingMessage ?? "");
  const [fallbackMessage, setFallbackMessage] = useState(settings.fallbackMessage ?? "");
  const [botIsAlwaysActive, setBotIsAlwaysActive] = useState(settings.botIsAlwaysActive);
  const [botActiveStart, setBotActiveStart] = useState(settings.botActiveStart);
  const [botActiveEnd, setBotActiveEnd] = useState(settings.botActiveEnd);
  const [timezone, setTimezone] = useState(settings.timezone);

  useEffect(() => {
    setBotName(settings.botName);
    setGreetingMessage(settings.greetingMessage ?? "");
    setFallbackMessage(settings.fallbackMessage ?? "");
    setBotIsAlwaysActive(settings.botIsAlwaysActive);
    setBotActiveStart(settings.botActiveStart);
    setBotActiveEnd(settings.botActiveEnd);
    setTimezone(settings.timezone);
  }, [settings]);

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateBotConfigAction({
        botName,
        greetingMessage,
        fallbackMessage,
        botIsAlwaysActive,
        botActiveStart,
        botActiveEnd,
        timezone,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configurações do atendente salvas com sucesso.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Atendente IA
          </CardTitle>
          <CardDescription>
            Personalize a atendente virtual do WhatsApp e defina o horário em que o
            bot pode responder automaticamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Personalidade da Atendente</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina como a atendente se apresenta e como deve lidar com o primeiro
                contato do cliente.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bot-name">Nome da atendente</Label>
              <Input
                id="bot-name"
                value={botName}
                onChange={(event) => setBotName(event.target.value)}
                placeholder="Ex.: Ana"
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt de personalidade</Label>
              <p className="text-sm text-muted-foreground">
                Para ajustar a personalidade da sua atendente, converse com um de
                nossos atendentes.
              </p>
              <div className="max-h-64 overflow-auto rounded-xl border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {settings.systemPrompt}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bot-greeting-message">
                Mensagem de boas-vindas (primeiro contato)
              </Label>
              <Textarea
                id="bot-greeting-message"
                rows={4}
                value={greetingMessage}
                onChange={(event) => setGreetingMessage(event.target.value)}
                placeholder="Olá! Sou a atendente virtual da clínica. Como posso te ajudar hoje?"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bot-fallback-message">
                Mensagem quando não souber responder
              </Label>
              <Textarea
                id="bot-fallback-message"
                rows={4}
                value={fallbackMessage}
                onChange={(event) => setFallbackMessage(event.target.value)}
                placeholder="Desculpa, tive um probleminha aqui. Pode tentar de novo?"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Horário de Funcionamento do Bot</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Fora desse intervalo o bot responde com uma mensagem automática de fora
                do expediente.
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <label
                htmlFor="bot-always-active"
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  id="bot-always-active"
                  type="checkbox"
                  checked={botIsAlwaysActive}
                  onChange={(event) => setBotIsAlwaysActive(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Atender 24 horas</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    O bot responde automaticamente a qualquer horário do dia.
                  </p>
                </div>
              </label>
            </div>

            <div
              className={`grid gap-4 md:grid-cols-3 ${
                botIsAlwaysActive ? "opacity-60" : ""
              }`}
            >
              <div className="space-y-1.5">
                <Label htmlFor="bot-active-start">Início do atendimento</Label>
                <Input
                  id="bot-active-start"
                  type="time"
                  value={botActiveStart}
                  onChange={(event) => setBotActiveStart(event.target.value)}
                  disabled={botIsAlwaysActive}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bot-active-end">Fim do atendimento</Label>
                <Input
                  id="bot-active-end"
                  type="time"
                  value={botActiveEnd}
                  onChange={(event) => setBotActiveEnd(event.target.value)}
                  disabled={botIsAlwaysActive}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bot-timezone">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => setTimezone(value ?? timezone)}
                  disabled={botIsAlwaysActive}
                >
                  <SelectTrigger id="bot-timezone" className="w-full">
                    <SelectValueLabel
                      value={timezone}
                      options={timezoneOptions}
                      placeholder="Selecione o timezone"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Status do WhatsApp
            </CardTitle>
            <CardDescription>
              Estado atual da conexão do número que atende esse tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {settings.phoneNumberId && settings.isActive ? (
                <>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Conectado
                  </Badge>
                  <Badge variant="outline">
                    {maskPhoneNumberId(settings.phoneNumberId)}
                  </Badge>
                </>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
                  Não configurado
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              A conexão do número WhatsApp é feita pela equipe Receps durante a
              ativação do seu plano.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Resumo Operacional
            </CardTitle>
            <CardDescription>
              Um retrato rápido do comportamento atual do atendente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Nome da atendente
              </p>
              <p className="mt-2 text-xl font-semibold">{botName || "Ana"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Identidade exibida para os clientes no WhatsApp.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Expediente do bot
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {botIsAlwaysActive ? "24 horas" : `${botActiveStart} às ${botActiveEnd}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{timezone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
