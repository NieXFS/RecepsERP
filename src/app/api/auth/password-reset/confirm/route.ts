import { NextResponse } from "next/server";
import { confirmPasswordResetSchema } from "@/lib/validators/password-reset";
import { confirmPasswordReset } from "@/services/password-reset.service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload inválido." },
      { status: 400 }
    );
  }

  const parsed = confirmPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 400 }
    );
  }

  try {
    const { email } = await confirmPasswordReset({
      token: parsed.data.token,
      password: parsed.data.password,
    });

    return NextResponse.json({ ok: true, email }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível redefinir sua senha.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
