"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Eye, EyeOff, MessageSquareLock, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createInitialBotConfigAdminAction,
  updateBotConfigAdminAction,
} from "@/actions/admin-bot-config.actions";
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
import type { AdminBotConfigRecord } from "@/services/bot-config.service";

const timezoneOptions = BOT_TIMEZONE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const modelOptions = BOT_AI_MODEL_OPTIONS.map((value) => ({
  value,
  label: value,
}));

type SensitiveInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function SensitiveInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: SensitiveInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setVisible((current) => !current)}
          className="shrink-0"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function AdminBotConfigInitializer({
  tenantId,
}: {
  tenantId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createInitialBotConfigAdminAction(tenantId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configuração inicial do bot criada.");
      router.refresh();
    });
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Configuração do Bot</CardTitle>
        <CardDescription>
          Este tenant ainda não possui bot configurado. Crie a configuração inicial
          para habilitar a edição completa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          Os valores iniciais usam os defaults do sistema. Depois disso, você pode
          editar personalidade, IA, credenciais do WhatsApp e status do bot.
        </div>
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending ? "Criando..." : "Criar configuração inicial"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminBotConfigPanel({
  config,
}: {
  config: AdminBotConfigRecord;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [botName, setBotName] = useState(config.botName);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt);
  const [greetingMessage, setGreetingMessage] = useState(config.greetingMessage ?? "");
  const [fallbackMessage, setFallbackMessage] = useState(config.fallbackMessage ?? "");
  const [aiModel, setAiModel] = useState(config.aiModel);
  const [aiTemperature, setAiTemperature] = useState(config.aiTemperature);
  const [aiMaxTokens, setAiMaxTokens] = useState(String(config.aiMaxTokens));
  const [botIsAlwaysActive, setBotIsAlwaysActive] = useState(config.botIsAlwaysActive);
  const [botActiveStart, setBotActiveStart] = useState(config.botActiveStart);
  const [botActiveEnd, setBotActiveEnd] = useState(config.botActiveEnd);
  const [timezone, setTimezone] = useState(config.timezone);
  const [wabaId, setWabaId] = useState(config.wabaId ?? "");
  const [phoneNumberId, setPhoneNumberId] = useState(config.phoneNumberId ?? "");
  const [waAccessToken, setWaAccessToken] = useState(config.waAccessToken ?? "");
  const [waVerifyToken, setWaVerifyToken] = useState(config.waVerifyToken ?? "");
  const [waApiVersion, setWaApiVersion] = useState(config.waApiVersion);
  const [openaiApiKey, setOpenaiApiKey] = useState(config.openaiApiKey ?? "");
  const [isActive, setIsActive] = useState(config.isActive);

  useEffect(() => {
    setBotName(config.botName);
    setSystemPrompt(config.systemPrompt);
    setGreetingMessage(config.greetingMessage ?? "");
    setFallbackMessage(config.fallbackMessage ?? "");
    setAiModel(config.aiModel);
    setAiTemperature(config.aiTemperature);
    setAiMaxTokens(String(config.aiMaxTokens));
    setBotIsAlwaysActive(config.botIsAlwaysActive);
    setBotActiveStart(config.botActiveStart);
    setBotActiveEnd(config.botActiveEnd);
    setTimezone(config.timezone);
    setWabaId(config.wabaId ?? "");
    setPhoneNumberId(config.phoneNumberId ?? "");
    setWaAccessToken(config.waAccessToken ?? "");
    setWaVerifyToken(config.waVerifyToken ?? "");
    setWaApiVersion(config.waApiVersion);
    setOpenaiApiKey(config.openaiApiKey ?? "");
    setIsActive(config.isActive);
  }, [config]);

  const statusLabel = useMemo(() => {
    if (isActive && phoneNumberId.trim()) {
      return "Ativo e vinculado";
    }

    if (isActive) {
      return "Ativo sem número";
    }

    return "Inativo";
  }, [isActive, phoneNumberId]);

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateBotConfigAdminAction({
        tenantId: config.tenantId,
        botName,
        systemPrompt,
        greetingMessage,
        fallbackMessage,
        aiModel,
        aiTemperature,
        aiMaxTokens: Number(aiMaxTokens),
        botIsAlwaysActive,
        botActiveStart,
        botActiveEnd,
        timezone,
        wabaId,
        phoneNumberId,
        waAccessToken,
        waVerifyToken,
        waApiVersion,
        openaiApiKey,
        isActive,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configurações do bot salvas.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Configuração do Bot
            </CardTitle>
            <CardDescription>
              Painel completo do bot deste tenant. Campos sensíveis alteram o
              comportamento da IA e a integração com o WhatsApp.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={isActive ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
              {statusLabel}
            </Badge>
            <Badge variant="outline">
              {phoneNumberId.trim() ? maskPhoneNumberId(phoneNumberId.trim()) : "Sem phoneNumberId"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Personalidade</CardTitle>
              <CardDescription>
                Comportamento, tom de voz e mensagens padrão da atendente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-bot-name">Nome da atendente</Label>
                <Input
                  id="admin-bot-name"
                  value={botName}
                  onChange={(event) => setBotName(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-system-prompt">Prompt de personalidade</Label>
                <Textarea
                  id="admin-system-prompt"
                  rows={18}
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-greeting-message">Mensagem de boas-vindas</Label>
                <Textarea
                  id="admin-greeting-message"
                  rows={4}
                  value={greetingMessage}
                  onChange={(event) => setGreetingMessage(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-fallback-message">Mensagem de fallback</Label>
                <Textarea
                  id="admin-fallback-message"
                  rows={4}
                  value={fallbackMessage}
                  onChange={(event) => setFallbackMessage(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Modelo de IA</CardTitle>
              <CardDescription>
                Configuração avançada do modelo, criatividade e limite de resposta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-ai-model">Modelo</Label>
                  <Select value={aiModel} onValueChange={(value) => setAiModel(value ?? aiModel)}>
                    <SelectTrigger id="admin-ai-model" className="w-full">
                      <SelectValueLabel
                        value={aiModel}
                        options={modelOptions}
                        placeholder="Selecione o modelo"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-ai-max-tokens">Tamanho máximo (tokens)</Label>
                  <Input
                    id="admin-ai-max-tokens"
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
                  <Label htmlFor="admin-ai-temperature">Criatividade</Label>
                  <Badge variant="outline">{aiTemperature.toFixed(1)}</Badge>
                </div>
                <input
                  id="admin-ai-temperature"
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

              <SensitiveInput
                id="admin-openai-api-key"
                label="OpenAI override"
                value={openaiApiKey}
                onChange={setOpenaiApiKey}
                placeholder="Opcional — vazio = usa a chave global"
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Horário de funcionamento</CardTitle>
              <CardDescription>
                Defina a janela de atendimento ou deixe o bot responder 24 horas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4">
                <label
                  htmlFor="admin-bot-always-active"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <input
                    id="admin-bot-always-active"
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

              <div className={`grid gap-4 md:grid-cols-3 ${botIsAlwaysActive ? "opacity-60" : ""}`}>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-bot-active-start">Início</Label>
                  <Input
                    id="admin-bot-active-start"
                    type="time"
                    value={botActiveStart}
                    onChange={(event) => setBotActiveStart(event.target.value)}
                    disabled={botIsAlwaysActive}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-bot-active-end">Fim</Label>
                  <Input
                    id="admin-bot-active-end"
                    type="time"
                    value={botActiveEnd}
                    onChange={(event) => setBotActiveEnd(event.target.value)}
                    disabled={botIsAlwaysActive}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-bot-timezone">Timezone</Label>
                  <Select
                    value={timezone}
                    onValueChange={(value) => setTimezone(value ?? timezone)}
                    disabled={botIsAlwaysActive}
                  >
                    <SelectTrigger id="admin-bot-timezone" className="w-full">
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareLock className="h-5 w-5 text-primary" />
                Credenciais WhatsApp
              </CardTitle>
              <CardDescription>
                Campos sensíveis — alterar apenas quando necessário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                Mudanças nesses campos podem interromper o atendimento do tenant
                imediatamente. Confirme os dados da Meta antes de salvar.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-waba-id">WABA ID</Label>
                <Input
                  id="admin-waba-id"
                  value={wabaId}
                  onChange={(event) => setWabaId(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-phone-number-id">phoneNumberId</Label>
                <Input
                  id="admin-phone-number-id"
                  value={phoneNumberId}
                  onChange={(event) => setPhoneNumberId(event.target.value)}
                />
              </div>

              <SensitiveInput
                id="admin-wa-access-token"
                label="waAccessToken"
                value={waAccessToken}
                onChange={setWaAccessToken}
              />

              <div className="space-y-1.5">
                <Label htmlFor="admin-wa-verify-token">waVerifyToken</Label>
                <Input
                  id="admin-wa-verify-token"
                  value={waVerifyToken}
                  onChange={(event) => setWaVerifyToken(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-wa-api-version">waApiVersion</Label>
                <Input
                  id="admin-wa-api-version"
                  value={waApiVersion}
                  onChange={(event) => setWaApiVersion(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Controle final de ativação do bot para este tenant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-background p-4">
                <label htmlFor="admin-bot-active" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="admin-bot-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ativar bot para este tenant</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Se ativado sem `phoneNumberId`, o salvamento será bloqueado.
                    </p>
                  </div>
                </label>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                O bot standalone usa cache de configuração por até 5 minutos. Em caso
                de mudança imediata de credencial ou prompt, aguarde esse intervalo
                para a atualização refletir em runtime.
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
