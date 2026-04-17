import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido."),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().min(32, "Token inválido."),
    password: z.string().min(8, "Mínimo de 8 caracteres."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não conferem.",
  });

export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
