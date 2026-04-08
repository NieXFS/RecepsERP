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

/** Configuração da grade de horários */
export const CALENDAR_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 20,
  SLOT_MINUTES: 30,
  SLOT_HEIGHT_PX: 48, // Altura de cada slot de 30min em pixels
} as const;

/** Gera os slots de horário para o eixo Y do grid */
export function generateTimeSlots() {
  const slots: { hour: number; minute: number; label: string }[] = [];
  for (let h = CALENDAR_CONFIG.START_HOUR; h < CALENDAR_CONFIG.END_HOUR; h++) {
    for (let m = 0; m < 60; m += CALENDAR_CONFIG.SLOT_MINUTES) {
      slots.push({
        hour: h,
        minute: m,
        label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}
