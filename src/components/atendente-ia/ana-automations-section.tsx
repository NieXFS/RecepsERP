"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarClock,
  ChevronDown,
  MessageSquareHeart,
  RefreshCw,
  Send,
  Sparkles,
  UserX,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  saveBotAutomationAction,
  syncBotAutomationStatusAction,
  triggerBotAutomationTestAction,
} from "@/actions/bot-automation.actions";
import type { BotAutomationVM } from "@/services/bot-automation.service";
import { AnaSectionCard } from "./ana-section-card";

const TEMPLATE_MAX = 900;

type AutomationType = BotAutomationVM["type"];
type MetaStatus = BotAutomationVM["metaTemplateStatus"];

type TypeConfig = {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  showWindowDays: boolean;
  previewValues: (tenantName: string) => Record<string, string>;
};

const TYPE_CONFIG: Record<AutomationType, TypeConfig> = {
  BIRTHDAY: {
    title: "Aniversário",
    subtitle: "Parabeniza o cliente no dia do aniversário.",
    icon: Cake,
    showWindowDays: false,
    previewValues: (tenantName) => ({ nome: "Maria", negocio: tenantName }),
  },
  INACTIVE: {
    title: "Clientes inativos",
    subtitle: "Reativa quem não aparece há algum tempo.",
    icon: UserX,
    showWindowDays: true,
    previewValues: (tenantName) => ({
      nome: "Maria",
      negocio: tenantName,
      ultimo_servico: "Limpeza de pele",
    }),
  },
  POST_APPOINTMENT: {
    title: "Pós-atendimento",
    subtitle: "Agradece cerca de 24h depois do serviço.",
    icon: MessageSquareHeart,
    showWindowDays: false,
    previewValues: (tenantName) => ({
      nome: "Maria",
      negocio: tenantName,
      servico: "Corte de cabelo",
      profissional: "Julia",
    }),
  },
  RESCHEDULE: {
    title: "Remarcação",
    subtitle: "Convida o cliente a reagendar após cancelamento/no-show.",
    icon: CalendarClock,
    showWindowDays: false,
    previewValues: (tenantName) => ({
      nome: "Maria",
      negocio: tenantName,
      servico: "Corte de cabelo",
      data_original: "10 de abril",
    }),
  },
};

const ORDER: AutomationType[] = [
  "BIRTHDAY",
  "INACTIVE",
  "POST_APPOINTMENT",
  "RESCHEDULE",
];

function statusBadge(status: MetaStatus, rejectionReason: string | null) {
  switch (status) {
    case "DRAFT":
      return {
        label: "Rascunho",
        className: "bg-muted text-muted-foreground border-border/60",
      };
    case "PENDING_APPROVAL":
      return {
        label: "Aguardando aprovação da Meta",
        className:
          "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
      };
    case "APPROVED":
      return {
        label: "Aprovado",
        className:
          "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30",
      };
    case "REJECTED":
      return {
        label: rejectionReason
          ? `Rejeitado: ${rejectionReason}`
          : "Rejeitado pela Meta",
        className:
          "bg-red-100 text-red-900 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30",
      };
    case "DELETED":
      return {
        label: "Template removido",
        className: "bg-muted text-muted-foreground border-border/60",
      };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

export function AnaAutomationsSection({
  automations,
  tenantName,
  style,
}: {
  automations: BotAutomationVM[];
  tenantName: string;
  style?: React.CSSProperties;
}) {
  const byType = new Map(automations.map((a) => [a.type, a] as const));

  return (
    <AnaSectionCard
      icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
      title="Automações"
      subtitle="Mensagens proativas que a Ana envia sozinha pelo WhatsApp."
      style={style}
    >
      <div className="flex flex-col gap-4">
        {ORDER.map((type) => {
          const row = byType.get(type);
          if (!row) return null;
          return (
            <AutomationCard
              key={type}
              automation={row}
              tenantName={tenantName}
            />
          );
        })}
      </div>
    </AnaSectionCard>
  );
}

function AutomationCard({
  automation,
  tenantName,
}: {
  automation: BotAutomationVM;
  tenantName: string;
}) {
  const router = useRouter();
  const config = TYPE_CONFIG[automation.type];
  const Icon = config.icon;

  const [enabled, setEnabled] = useState(automation.enabled);
  const [templateText, setTemplateText] = useState(automation.templateText);
  const [windowDays, setWindowDays] = useState<number | null>(
    automation.windowDays
  );
  const [status, setStatus] = useState<MetaStatus>(
    automation.metaTemplateStatus
  );
  const [rejectionReason, setRejectionReason] = useState(
    automation.metaTemplateRejectionReason
  );
  const [lastSyncedAt, setLastSyncedAt] = useState(automation.metaLastSyncedAt);
  const [savingPending, startSaveTransition] = useTransition();
  const [syncPending, startSyncTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();

  const [testOpen, setTestOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const badge = statusBadge(status, rejectionReason);
  const approved = status === "APPROVED";
  const canToggleOn = enabled || approved || automation.metaTemplateName === null;
  const toggleDisabled = !canToggleOn && !enabled;

  const baseline = automation;
  const windowDirty =
    config.showWindowDays &&
    (windowDays ?? null) !== (baseline.windowDays ?? null);
  const dirty =
    enabled !== baseline.enabled ||
    templateText !== baseline.templateText ||
    windowDirty;

  const length = templateText.length;
  const overLimit = length > TEMPLATE_MAX;
  const templateInvalid = templateText.trim().length === 0 || overLimit;
  const windowInvalid =
    config.showWindowDays &&
    windowDays !== null &&
    (windowDays < 7 || windowDays > 365);

  const availableVars = automation.availableVars;

  const previewText = useMemo(() => {
    const values = config.previewValues(tenantName);
    return templateText.replace(
      /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
      (match, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name) ? values[name] : match
    );
  }, [templateText, tenantName, config]);

  function insertVariable(name: string) {
    const el = textareaRef.current;
    const token = `{{${name}}}`;
    if (!el) {
      setTemplateText((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? templateText.length;
    const end = el.selectionEnd ?? templateText.length;
    const next = templateText.slice(0, start) + token + templateText.slice(end);
    setTemplateText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function handleSave() {
    if (templateInvalid) {
      toast.error("Revise o texto da mensagem antes de salvar.");
      return;
    }
    if (windowInvalid) {
      toast.error("O período de inatividade deve estar entre 7 e 365 dias.");
      return;
    }
    startSaveTransition(async () => {
      const result = await saveBotAutomationAction({
        type: automation.type,
        enabled,
        templateText,
        ...(config.showWindowDays ? { windowDays } : {}),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Automação salva.");
      setStatus(result.data.metaTemplateStatus);
      setRejectionReason(result.data.metaTemplateRejectionReason);
      setLastSyncedAt(result.data.metaLastSyncedAt);
      setEnabled(result.data.enabled);
      setTemplateText(result.data.templateText);
      setWindowDays(result.data.windowDays);
      router.refresh();
    });
  }

  function handleSync() {
    startSyncTransition(async () => {
      const result = await syncBotAutomationStatusAction({
        type: automation.type,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setStatus(result.data.metaTemplateStatus);
      setRejectionReason(result.data.metaTemplateRejectionReason);
      setLastSyncedAt(result.data.metaLastSyncedAt);
      toast.success("Status atualizado.");
    });
  }

  function handleSendTest() {
    if (!/^\d{10,15}$/.test(testPhone)) {
      toast.error("Informe o telefone em E.164 sem o +, ex: 5521999998888.");
      return;
    }
    startTestTransition(async () => {
      const result = await triggerBotAutomationTestAction({
        type: automation.type,
        to: testPhone,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Teste enviado (messageId: ${result.data.messageId}).`);
    });
  }

  return (
    <div className="rounded-xl border border-primary/15 bg-background/60 p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{config.title}</p>
            <Badge
              variant="outline"
              aria-live="polite"
              className={cn("text-[10px] font-medium", badge.className)}
            >
              {badge.label}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={syncPending || !automation.metaTemplateName}
              className="h-6 gap-1 px-2 text-[11px]"
              title="Consulta o status do template na Meta"
            >
              <RefreshCw
                className={cn("h-3 w-3", syncPending && "animate-spin")}
                aria-hidden="true"
              />
              Verificar agora
            </Button>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {config.subtitle}
          </p>
          {lastSyncedAt ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Última sincronização:{" "}
              {new Date(lastSyncedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </div>
        <label
          htmlFor={`automation-toggle-${automation.type}`}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
            enabled
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/40 text-muted-foreground",
            toggleDisabled && "cursor-not-allowed opacity-60"
          )}
          title={
            toggleDisabled
              ? "Aprove o template antes de ativar."
              : "Ativa ou desativa o envio automático."
          }
        >
          <input
            id={`automation-toggle-${automation.type}`}
            type="checkbox"
            checked={enabled}
            disabled={toggleDisabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          {enabled ? "Ativada" : "Desligada"}
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={`automation-text-${automation.type}`}
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Texto da mensagem
          </Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              overLimit
                ? "text-destructive"
                : length > TEMPLATE_MAX * 0.9
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            )}
          >
            {length}/{TEMPLATE_MAX}
          </span>
        </div>
        <Textarea
          id={`automation-text-${automation.type}`}
          ref={textareaRef}
          rows={4}
          value={templateText}
          onChange={(event) => setTemplateText(event.target.value)}
          aria-invalid={templateInvalid ? true : undefined}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Variáveis:
          </span>
          {availableVars.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => insertVariable(name)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
            >
              <Wand2 className="h-3 w-3" aria-hidden="true" />
              {`{{${name}}}`}
            </button>
          ))}
        </div>

        {config.showWindowDays ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <Label
                htmlFor={`automation-window-${automation.type}`}
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
              >
                Período de inatividade (dias)
              </Label>
              <Input
                id={`automation-window-${automation.type}`}
                type="number"
                min={7}
                max={365}
                value={windowDays ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    setWindowDays(null);
                    return;
                  }
                  const parsed = Number.parseInt(raw, 10);
                  setWindowDays(Number.isFinite(parsed) ? parsed : null);
                }}
                aria-invalid={windowInvalid ? true : undefined}
                className="h-9 w-28"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              A Ana só envia a reativação depois desse período sem visita.
            </p>
          </div>
        ) : null}

        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Pré-visualização
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{previewText}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !dirty || templateInvalid || windowInvalid || savingPending
            }
            className="gap-1.5"
          >
            {savingPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        <details
          className="group/test rounded-lg border border-border/60 bg-muted/10 open:bg-muted/20"
          open={testOpen}
          onToggle={(event) => setTestOpen(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Testar
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                testOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-2 px-3 pb-3">
            <Label
              htmlFor={`automation-test-phone-${automation.type}`}
              className="text-xs text-muted-foreground"
            >
              Telefone de destino (E.164 sem +)
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id={`automation-test-phone-${automation.type}`}
                value={testPhone}
                onChange={(event) =>
                  setTestPhone(event.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="5521999998888"
                className="h-8 max-w-[220px] font-mono text-xs"
                inputMode="numeric"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSendTest}
                disabled={!approved || testPending || testPhone.length < 10}
                className="h-8 gap-1.5"
                title={
                  !approved
                    ? "Só é possível testar com template aprovado"
                    : "Enviar teste agora"
                }
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {testPending ? "Enviando..." : "Disparar teste"}
              </Button>
            </div>
            {!approved ? (
              <p className="text-[11px] text-muted-foreground">
                Disponível depois que o template for aprovado pela Meta.
              </p>
            ) : null}
          </div>
        </details>
      </div>
    </div>
  );
}
