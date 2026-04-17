"use client";

import { MessagesSquare } from "lucide-react";
import { AnaSectionCard } from "./ana-section-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const GREETING_MAX = 500;
const FALLBACK_MAX = 500;

export function AnaMessagesSection({
  greetingMessage,
  fallbackMessage,
  onGreetingChange,
  onFallbackChange,
  style,
}: {
  greetingMessage: string;
  fallbackMessage: string;
  onGreetingChange: (value: string) => void;
  onFallbackChange: (value: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <AnaSectionCard
      icon={<MessagesSquare className="h-5 w-5" aria-hidden="true" />}
      title="Mensagens"
      subtitle="O que a Ana diz no primeiro contato e quando não consegue ajudar."
      style={style}
    >
      <MessageField
        id="ana-greeting"
        label="Mensagem de boas-vindas"
        description="Enviada no primeiro contato do cliente com o WhatsApp."
        value={greetingMessage}
        onChange={onGreetingChange}
        placeholder="Olá! Sou a Ana, atendente virtual. Como posso te ajudar hoje?"
        max={GREETING_MAX}
      />

      <MessageField
        id="ana-fallback"
        label="Mensagem de fallback"
        description="Usada quando a Ana não entende ou não sabe responder."
        value={fallbackMessage}
        onChange={onFallbackChange}
        placeholder="Desculpa, tive um probleminha aqui. Pode tentar de novo?"
        max={FALLBACK_MAX}
      />
    </AnaSectionCard>
  );
}

function MessageField({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  max,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  max: number;
}) {
  const length = value.length;
  const nearLimit = length > max * 0.9;
  const overLimit = length > max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          {label}
        </Label>
        <span
          className={cn(
            "text-xs tabular-nums",
            overLimit
              ? "text-destructive"
              : nearLimit
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          )}
        >
          {length}/{max}
        </span>
      </div>
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
