import type { BotAutomationType } from "@/generated/prisma/enums";

export const AVAILABLE_VARS_BY_TYPE: Record<BotAutomationType, readonly string[]> = {
  BIRTHDAY: ["nome", "negocio"],
  INACTIVE: ["nome", "negocio", "ultimo_servico"],
  POST_APPOINTMENT: ["nome", "servico", "profissional", "negocio"],
  RESCHEDULE: ["nome", "servico", "data_original", "negocio"],
};

export type VariableMapEntry = { position: number; varName: string };

const VAR_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function convertToPositional(
  text: string,
  type: BotAutomationType
): { metaText: string; variableMap: VariableMapEntry[] } {
  const allowed = new Set(AVAILABLE_VARS_BY_TYPE[type]);
  const variableMap: VariableMapEntry[] = [];
  const seenIndex = new Map<string, number>();

  const metaText = text.replace(VAR_PATTERN, (_match, varName: string) => {
    if (!allowed.has(varName)) {
      throw new Error(
        `Variável {{${varName}}} não é permitida para automações do tipo ${type}. Use apenas: ${[...allowed]
          .map((v) => `{{${v}}}`)
          .join(", ")}.`
      );
    }
    const existing = seenIndex.get(varName);
    if (existing !== undefined) {
      return `{{${existing}}}`;
    }
    const position = variableMap.length + 1;
    seenIndex.set(varName, position);
    variableMap.push({ position, varName });
    return `{{${position}}}`;
  });

  return { metaText, variableMap };
}

export function renderForMeta(
  variableMap: VariableMapEntry[],
  values: Record<string, string>
): string[] {
  const sorted = [...variableMap].sort((a, b) => a.position - b.position);
  return sorted.map((entry) => values[entry.varName] ?? "");
}

export function renderPreview(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(VAR_PATTERN, (match, varName: string) => {
    return Object.prototype.hasOwnProperty.call(values, varName)
      ? values[varName]
      : match;
  });
}

export function isValidVariableMap(value: unknown): value is VariableMapEntry[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as VariableMapEntry).position === "number" &&
      typeof (entry as VariableMapEntry).varName === "string"
  );
}
