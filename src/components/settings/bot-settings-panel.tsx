"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Clock3, MessageSquareText, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { updateBotConfigAction } from "@/actions/bot-config.actions";
import {
  BOT_AI_MODEL_OPTIONS,
  BOT_TIMEZONE_OPTIONS,
  maskPhoneNumberId,
} from "@/lib/bot-config";
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

const aiModelOptions = BOT_AI_MODEL_OPTIONS.map((value) => ({
  value,
  label: value,
}));

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
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [greetingMessage, setGreetingMessage] = useState(settings.greetingMessage ?? "");
  const [fallbackMessage, setFallbackMessage] = useState(settings.fallbackMessage ?? "");
  const [aiModel, setAiModel] = useState(settings.aiModel);
  const [aiTemperature, setAiTemperature] = useState(settings.aiTemperature);
  const [aiMaxTokens, setAiMaxTokens] = useState(String(settings.aiMaxTokens));
  const [botActiveStart, setBotActiveStart] = useState(settings.botActiveStart);
  const [botActiveEnd, setBotActiveEnd] = useState(settings.botActiveEnd);
  const [timezone, setTimezone] = useState(settings.timezone);

  useEffect(() => {
    setBotName(settings.botName);
    setSystemPrompt(settings.systemPrompt);
    setGreetingMessage(settings.greetingMessage ?? "");
    setFallbackMessage(settings.fallbackMessage ?? "");
    setAiModel(settings.aiModel);
    setAiTemperature(settings.aiTemperature);
    setAiMaxTokens(String(settings.aiMaxTokens));
    setBotActiveStart(settings.botActiveStart);
    setBotActiveEnd(settings.botActiveEnd);
    setTimezone(settings.timezone);
  }, [settings]);

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateBotConfigAction({
        botName,
        systemPrompt,
        greetingMessage,
        fallbackMessage,
        aiModel,
        aiTemperature,
        aiMaxTokens: Number(aiMaxTokens),
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
            Personalize a atendente virtual do WhatsApp, ajuste o comportamento da IA e
            defina o horário em que o bot pode responder automaticamente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Personalidade da Atendente</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Defina como a atendente se apresenta, quais regras deve seguir e como
                deve lidar com o primeiro contato do cliente.
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

            <div className="space-y-1.5">
              <Label htmlFor="bot-system-prompt">Prompt de personalidade</Label>
              <Textarea
                id="bot-system-prompt"
                rows={12}
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Descreva como a atendente deve se comportar, o tom de voz e regras especiais."
              />
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
              <h3 className="text-sm font-semibold">Modelo de IA</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha o modelo, ajuste o nível de criatividade e limite o tamanho das
                respostas do bot.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bot-ai-model">Modelo</Label>
                <Select value={aiModel} onValueChange={(value) => setAiModel(value ?? aiModel)}>
                  <SelectTrigger id="bot-ai-model" className="w-full">
                    <SelectValueLabel
                      value={aiModel}
                      options={aiModelOptions}
                      placeholder="Selecione o modelo"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bot-ai-max-tokens">
                  Tamanho máximo da resposta (tokens)
                </Label>
                <Input
                  id="bot-ai-max-tokens"
                  type="number"
                  min={100}
                  max={4000}
                  value={aiMaxTokens}
                  onChange={(event) => setAiMaxTokens(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="bot-ai-temperature">Criatividade</Label>
                <Badge variant="outline">{aiTemperature.toFixed(1)}</Badge>
              </div>
              <input
                id="bot-ai-temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiTemperature}
                onChange={(event) => setAiTemperature(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mais precisa</span>
                <span>Mais criativa</span>
              </div>
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bot-active-start">Início do atendimento</Label>
                <Input
                  id="bot-active-start"
                  type="time"
                  value={botActiveStart}
                  onChange={(event) => setBotActiveStart(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bot-active-end">Fim do atendimento</Label>
                <Input
                  id="bot-active-end"
                  type="time"
                  value={botActiveEnd}
                  onChange={(event) => setBotActiveEnd(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bot-timezone">Timezone</Label>
                <Select
                  value={timezone}
                  onValueChange={(value) => setTimezone(value ?? timezone)}
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
              <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Resumo Operacional
            </CardTitle>
            <CardDescription>
              Um retrato rápido do comportamento atual do atendente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Nome & modelo
              </p>
              <p className="mt-2 text-xl font-semibold">{botName || "Ana"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{aiModel}</p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Expediente do bot
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {botActiveStart} às {botActiveEnd}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{timezone}</p>
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Criatividade
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold">{aiTemperature.toFixed(1)}</p>
                <Clock3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Respostas limitadas a {aiMaxTokens || "--"} tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
