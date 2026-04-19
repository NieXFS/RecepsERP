import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "@/lib/email/client";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(120, "Nome muito longo."),
  email: z
    .email("E-mail inválido.")
    .transform((value) => value.toLowerCase().trim()),
  subject: z
    .string()
    .trim()
    .min(5, "Mensagem muito curta.")
    .max(4000, "Mensagem muito longa."),
  website: z.string().optional(),
});

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  if (!isEmailConfigured()) {
    console.error("[contact] Resend não configurado — defina RESEND_API_KEY e EMAIL_FROM.");
    return NextResponse.json(
      { error: "Serviço de e-mail indisponível no momento." },
      { status: 503 }
    );
  }

  const to = process.env.CONTACT_EMAIL_TO?.trim() || "contato@receps.com.br";
  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json(
      { error: "Serviço de e-mail indisponível no momento." },
      { status: 503 }
    );
  }

  const { name, email, subject } = parsed.data;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject).replace(/\n/g, "<br/>");

  const result = await resend.emails.send({
    from: getEmailFrom(),
    to: [to],
    replyTo: getEmailReplyTo(),
    subject: `[receps.com.br] Contato de ${name}`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#0B0B1A;max-width:560px">
        <h2 style="margin:0 0 16px;font-size:18px">Nova mensagem pela landing</h2>
        <p style="margin:0 0 8px"><strong>Nome:</strong> ${safeName}</p>
        <p style="margin:0 0 8px"><strong>E-mail:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <div style="margin-top:16px;padding:16px;border-radius:8px;background:#F5F5FA">
          <p style="margin:0 0 8px;font-weight:600">Mensagem</p>
          <div>${safeSubject}</div>
        </div>
      </div>
    `.trim(),
    text: `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${subject}`,
  });

  if (result.error) {
    console.error("[contact] Falha Resend:", result.error);
    return NextResponse.json(
      { error: "Não foi possível enviar sua mensagem. Tente novamente em instantes." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
