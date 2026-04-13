import {
  CALENDAR_SLOT_HEIGHT_PX,
  generateTimeSlots as generateTenantTimeSlots,
  type TenantScheduleConfig,
} from "@/lib/tenant-schedule";

/** Profissional serializado para o Client Component da agenda */
export type CalendarProfessional = {
  id: string;
  name: string;
  specialty: string | null;
  serviceIds: string[]; // IDs dos serviços que este profissional pode realizar
};

/** Agendamento serializado para renderização no grid */
export type CalendarAppointment = {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSpecialty: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  roomName: string | null;
  startTime: string; // ISO string
  endTime: string;
  status: string;
  totalPrice: number;
  services: { name: string; price: number }[];
  equipments: string[];
};

/** Agendamento serializado para o painel operacional do dia. */
export type OperationalAppointment = {
  id: string;
  professionalId: string;
  professionalName: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  services: string[];
};

/** Conta financeira disponível para destino do pagamento no checkout. */
export type CalendarFinancialAccount = {
  id: string;
  name: string;
  type: string;
};

/** Serviço disponível para seleção no formulário */
export type CalendarService = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

/** Cliente para o buscador do formulário */
export type CalendarCustomer = {
  id: string;
  name: string;
  phone: string | null;
};

/** Sala/Equipamento para selects do formulário */
export type CalendarResource = {
  id: string;
  name: string;
};

export type CalendarScheduleConfig = TenantScheduleConfig;

/** Configuração visual fixa da grade (a malha é dinâmica, a altura do slot não). */
export const CALENDAR_CONFIG = {
  SLOT_HEIGHT_PX: CALENDAR_SLOT_HEIGHT_PX,
} as const;

/** Gera os slots de horário para o eixo Y do grid com base no expediente do tenant. */
export function generateTimeSlots(config: CalendarScheduleConfig) {
  return generateTenantTimeSlots(config);
}
