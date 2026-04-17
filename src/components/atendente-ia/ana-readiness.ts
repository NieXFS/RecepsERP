import {
  DEFAULT_BOT_FALLBACK_MESSAGE,
  DEFAULT_BOT_GREETING_MESSAGE,
  DEFAULT_BOT_NAME,
  DEFAULT_BOT_SYSTEM_PROMPT,
} from "@/lib/bot-config";

export type AnaReadinessInput = {
  botName: string;
  systemPrompt: string;
  greetingMessage: string;
  fallbackMessage: string;
  botIsAlwaysActive: boolean;
  botActiveStart: string;
  botActiveEnd: string;
  whatsappConnected: boolean;
};

export type AnaReadinessItem = {
  id: string;
  label: string;
  done: boolean;
  partial?: boolean;
};

export type AnaReadinessResult = {
  score: number;
  items: AnaReadinessItem[];
};

function normalize(value: string) {
  return value.trim();
}

function hasCustomName(name: string) {
  const trimmed = normalize(name);
  if (!trimmed) return "empty" as const;
  if (trimmed.toLowerCase() === DEFAULT_BOT_NAME.toLowerCase()) return "default" as const;
  return "custom" as const;
}

function isValidTimeRange(start: string, end: string) {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) return false;
  return end > start;
}

export function computeAnaReadiness(input: AnaReadinessInput): AnaReadinessResult {
  const nameState = hasCustomName(input.botName);
  const nameScore = nameState === "custom" ? 1 : nameState === "default" ? 0.5 : 0;

  const promptScore =
    normalize(input.systemPrompt) &&
    normalize(input.systemPrompt) !== normalize(DEFAULT_BOT_SYSTEM_PROMPT)
      ? 1
      : 0;

  const greetingTrimmed = normalize(input.greetingMessage);
  const greetingScore = greetingTrimmed.length > 0 ? 1 : 0;

  const fallbackTrimmed = normalize(input.fallbackMessage);
  const fallbackScore = fallbackTrimmed.length > 0 ? 1 : 0;

  const hoursScore =
    input.botIsAlwaysActive || isValidTimeRange(input.botActiveStart, input.botActiveEnd)
      ? 1
      : 0;

  const whatsappScore = input.whatsappConnected ? 1 : 0;

  const total = nameScore + promptScore + greetingScore + fallbackScore + hoursScore + whatsappScore;
  const score = Math.round((total / 6) * 100);

  const items: AnaReadinessItem[] = [
    {
      id: "name",
      label:
        nameState === "default"
          ? "Nome da atendente (usando padrão Ana)"
          : "Nome da atendente definido",
      done: nameState === "custom",
      partial: nameState === "default",
    },
    {
      id: "prompt",
      label: "Personalidade ajustada com o suporte",
      done: promptScore === 1,
    },
    {
      id: "greeting",
      label: greetingTrimmed
        ? "Mensagem de boas-vindas preenchida"
        : "Mensagem de boas-vindas pendente",
      done: greetingScore === 1,
    },
    {
      id: "fallback",
      label: fallbackTrimmed
        ? "Mensagem de fallback preenchida"
        : "Mensagem de fallback pendente",
      done: fallbackScore === 1,
    },
    {
      id: "hours",
      label: input.botIsAlwaysActive
        ? "Expediente 24 horas ativado"
        : isValidTimeRange(input.botActiveStart, input.botActiveEnd)
          ? `Expediente ${input.botActiveStart} às ${input.botActiveEnd}`
          : "Expediente com horário inválido",
      done: hoursScore === 1,
    },
    {
      id: "whatsapp",
      label: input.whatsappConnected
        ? "WhatsApp conectado e ativo"
        : "WhatsApp aguardando ativação pelo suporte",
      done: whatsappScore === 1,
    },
  ];

  return { score, items };
}

export const DEFAULT_ANA_GREETING = DEFAULT_BOT_GREETING_MESSAGE;
export const DEFAULT_ANA_FALLBACK = DEFAULT_BOT_FALLBACK_MESSAGE;
