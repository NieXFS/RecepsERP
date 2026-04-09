import { z } from "zod";
import { parseCivilDate } from "@/lib/civil-date";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const EXPENSE_TYPE_VALUES = ["FIXED", "VARIABLE"] as const;
export const EXPENSE_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;
export const EXPENSE_RECURRENCE_VALUES = [
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
  "NONE",
] as const;

const civilDateStringSchema = z
  .string()
  .trim()
  .refine((value) => parseCivilDate(value) !== null, "Informe uma data válida.");

const expenseBaseShape = {
  categoryId: z.string().min(1, "Selecione a categoria."),
  accountId: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  description: z.string().trim().min(3, "Descreva a despesa."),
  type: z.enum(EXPENSE_TYPE_VALUES),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  dueDate: civilDateStringSchema,
  recurrence: z.enum(EXPENSE_RECURRENCE_VALUES).default("NONE"),
  notes: optionalTrimmedString,
} satisfies z.ZodRawShape;

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria."),
  description: optionalTrimmedString,
});

export const expenseSchema = z.object(expenseBaseShape).superRefine((value, ctx) => {
  if (value.type === "VARIABLE" && value.recurrence !== "NONE") {
    ctx.addIssue({
      code: "custom",
      path: ["recurrence"],
      message: "A recorrência só pode ser usada em despesas fixas.",
    });
  }
});

export const updateExpenseSchema = z
  .object(expenseBaseShape)
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Informe ao menos um campo para atualizar.",
      });
    }

    if (value.type === "VARIABLE" && value.recurrence && value.recurrence !== "NONE") {
      ctx.addIssue({
        code: "custom",
        path: ["recurrence"],
        message: "A recorrência só pode ser usada em despesas fixas.",
      });
    }
  });

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
