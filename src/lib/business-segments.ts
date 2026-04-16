import type { TenantBusinessSegment } from "@/generated/prisma/enums";

/**
 * Metadados de cada segmento de negócio suportado pelo Receps.
 * Centraliza labels, copy de marketing e sugestões de serviços iniciais
 * para o fluxo de setup em /bem-vindo.
 */

export type StarterService = {
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
};

export type BusinessSegmentDefinition = {
  key: TenantBusinessSegment;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  starterServices: readonly StarterService[];
  sampleProfessionalSpecialty: string;
};

export const BUSINESS_SEGMENT_DEFINITIONS: readonly BusinessSegmentDefinition[] = [
  {
    key: "CLINICA_ESTETICA",
    label: "Clínica estética",
    shortLabel: "Clínica estética",
    description: "Procedimentos faciais, corporais e tratamentos de pele.",
    emoji: "✨",
    sampleProfessionalSpecialty: "Esteticista",
    starterServices: [
      { name: "Limpeza de pele profunda", durationMinutes: 60, price: 180, description: "Limpeza com extração e máscara calmante." },
      { name: "Peeling facial", durationMinutes: 45, price: 220 },
      { name: "Drenagem linfática", durationMinutes: 50, price: 150 },
    ],
  },
  {
    key: "BARBEARIA",
    label: "Barbearia",
    shortLabel: "Barbearia",
    description: "Cortes, barbas e tratamentos capilares masculinos.",
    emoji: "💈",
    sampleProfessionalSpecialty: "Barbeiro",
    starterServices: [
      { name: "Corte masculino", durationMinutes: 30, price: 50 },
      { name: "Barba", durationMinutes: 30, price: 40 },
      { name: "Corte + Barba", durationMinutes: 60, price: 80, description: "Combo com lavagem e finalização." },
    ],
  },
  {
    key: "SALAO_BELEZA",
    label: "Salão de beleza",
    shortLabel: "Salão",
    description: "Cabelo, unhas, maquiagem e estética feminina.",
    emoji: "💅",
    sampleProfessionalSpecialty: "Cabeleireira",
    starterServices: [
      { name: "Corte feminino", durationMinutes: 45, price: 80 },
      { name: "Escova", durationMinutes: 45, price: 70 },
      { name: "Manicure + Pedicure", durationMinutes: 75, price: 70 },
    ],
  },
  {
    key: "ODONTOLOGIA",
    label: "Consultório odontológico",
    shortLabel: "Odontologia",
    description: "Atendimento clínico geral e especialidades odontológicas.",
    emoji: "🦷",
    sampleProfessionalSpecialty: "Dentista",
    starterServices: [
      { name: "Consulta de avaliação", durationMinutes: 30, price: 150 },
      { name: "Limpeza / profilaxia", durationMinutes: 45, price: 200 },
      { name: "Clareamento dental", durationMinutes: 60, price: 450 },
    ],
  },
  {
    key: "CENTRO_ESTETICO",
    label: "Centro estético",
    shortLabel: "Centro estético",
    description: "Equipe multidisciplinar e procedimentos combinados.",
    emoji: "💆",
    sampleProfessionalSpecialty: "Esteticista",
    starterServices: [
      { name: "Avaliação estética", durationMinutes: 45, price: 120 },
      { name: "Massagem relaxante", durationMinutes: 60, price: 180 },
      { name: "Criolipólise (sessão)", durationMinutes: 60, price: 350 },
    ],
  },
  {
    key: "STUDIO_BELEZA",
    label: "Studio de beleza",
    shortLabel: "Studio",
    description: "Sobrancelhas, cílios, design e micropigmentação.",
    emoji: "🎨",
    sampleProfessionalSpecialty: "Designer de sobrancelhas",
    starterServices: [
      { name: "Design de sobrancelhas", durationMinutes: 30, price: 60 },
      { name: "Extensão de cílios (volume brasileiro)", durationMinutes: 90, price: 180 },
      { name: "Micropigmentação de sobrancelhas", durationMinutes: 120, price: 650 },
    ],
  },
  {
    key: "OUTRO",
    label: "Outro tipo de negócio",
    shortLabel: "Outro",
    description: "Atendimentos personalizados não cobertos pelos segmentos acima.",
    emoji: "🌟",
    sampleProfessionalSpecialty: "Profissional",
    starterServices: [
      { name: "Atendimento 30min", durationMinutes: 30, price: 80 },
      { name: "Atendimento 60min", durationMinutes: 60, price: 150 },
      { name: "Retorno", durationMinutes: 30, price: 60 },
    ],
  },
] as const;

const SEGMENT_MAP = new Map(BUSINESS_SEGMENT_DEFINITIONS.map((seg) => [seg.key, seg]));

export function getBusinessSegment(key: TenantBusinessSegment): BusinessSegmentDefinition {
  const def = SEGMENT_MAP.get(key);
  if (!def) {
    throw new Error(`Segmento desconhecido: ${key}`);
  }
  return def;
}

export function isValidBusinessSegment(value: unknown): value is TenantBusinessSegment {
  if (typeof value !== "string") return false;
  return SEGMENT_MAP.has(value as TenantBusinessSegment);
}

export const BUSINESS_SEGMENT_VALUES = BUSINESS_SEGMENT_DEFINITIONS.map((s) => s.key) as TenantBusinessSegment[];
