export type AppointmentDescriptionInput = {
  customerName: string | null | undefined;
  serviceNames: string[];
  installmentNumber?: number | null;
  totalInstallments?: number | null;
};

/**
 * Monta a descrição humana de uma transação vinculada a agendamento.
 * Formato: "Cliente — Serviço" ou "Cliente — Serviço +N" / "Cliente — Serviço (i/N)".
 */
export function buildAppointmentDescription(
  input: AppointmentDescriptionInput
): string {
  const customer = input.customerName?.trim() || "Cliente avulso";
  const services = input.serviceNames.filter(Boolean);

  let servicePart: string;
  if (services.length === 0) {
    servicePart = "Atendimento";
  } else if (services.length === 1) {
    servicePart = services[0]!;
  } else {
    servicePart = `${services[0]} +${services.length - 1}`;
  }

  const hasInstallments =
    typeof input.installmentNumber === "number" &&
    typeof input.totalInstallments === "number" &&
    input.totalInstallments > 1;

  const installmentPart = hasInstallments
    ? ` (${input.installmentNumber}/${input.totalInstallments})`
    : "";

  return `${customer} — ${servicePart}${installmentPart}`;
}
