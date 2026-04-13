import { z } from "zod";
import {
  TENANT_SLOT_INTERVAL_OPTIONS,
  parseTimeStringToMinutes,
} from "@/lib/tenant-schedule";

const optionalTextField = z.string().trim().optional().or(z.literal(""));

export const tenantBusinessSettingsSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do estabelecimento."),
    document: optionalTextField,
    phone: optionalTextField,
    email: optionalTextField.refine((value) => {
      if (!value) {
        return true;
      }

      return z.string().email().safeParse(value).success;
    }, "Informe um email válido."),
    openingTime: z.string().trim().min(1, "Informe o horário de abertura."),
    closingTime: z.string().trim().min(1, "Informe o horário de fechamento."),
    slotIntervalMinutes: z.coerce
      .number()
      .refine(
        (value) =>
          TENANT_SLOT_INTERVAL_OPTIONS.includes(
            value as (typeof TENANT_SLOT_INTERVAL_OPTIONS)[number]
          ),
        "Selecione um intervalo de agenda válido."
      ),
  })
  .refine((data) => {
    const openingMinutes = parseTimeStringToMinutes(data.openingTime);
    const closingMinutes = parseTimeStringToMinutes(data.closingTime);

    if (openingMinutes == null || closingMinutes == null) {
      return false;
    }

    return closingMinutes > openingMinutes;
  }, {
    path: ["closingTime"],
    message: "O fechamento deve ser posterior ao horário de abertura.",
  });

export type TenantBusinessSettingsInput = z.infer<
  typeof tenantBusinessSettingsSchema
>;
