import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "@/lib/cnpj";
import { db } from "@/lib/db";

const querySchema = z.object({
  cnpj: z
    .string()
    .trim()
    .min(1, "CNPJ obrigatório.")
    .refine((value) => isValidCnpj(value), "CNPJ inválido.")
    .transform((value) => normalizeCnpj(value)),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    cnpj: url.searchParams.get("cnpj") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        exists: false,
        error: parsed.error.issues[0]?.message ?? "CNPJ inválido.",
      },
      { status: 400 }
    );
  }

  const tenant = await db.tenant.findFirst({
    where: { cnpj: parsed.data.cnpj },
    select: { id: true },
  });

  return NextResponse.json({
    exists: Boolean(tenant),
  });
}
