import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAiBotApiKey } from "@/lib/api-auth";

// Contrato consumido pelo bot-processor.
//
// POST /api/internal/opt-out
//   Authorization: Bearer <AI_BOT_API_KEY>
//   Content-Type: application/json
//   Body: { phoneNumberId: string, customerPhone: string }
//
// Respostas:
//   401 → segredo ausente/errado.
//   200 { ok: true, customerFound: false, reason?: "TENANT_NOT_FOUND" }
//        → tenant/cliente não localizado. Bot-processor não retenta.
//   200 { ok: true, customerFound: true, customerId }
//        → opt-out persistido.
//   500 → erro interno (mensagem genérica).

export const dynamic = "force-dynamic";

function normalizePhone(raw: string): string {
  return raw.replace(/\D+/g, "");
}

type Body = {
  phoneNumberId?: unknown;
  customerPhone?: unknown;
};

export async function POST(request: Request) {
  const authError = requireAiBotApiKey(request);
  if (authError) return authError;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const phoneNumberId =
    typeof body.phoneNumberId === "string" ? body.phoneNumberId.trim() : "";
  const customerPhoneRaw =
    typeof body.customerPhone === "string" ? body.customerPhone : "";
  const customerPhone = normalizePhone(customerPhoneRaw);

  if (!phoneNumberId || !customerPhone) {
    return NextResponse.json(
      { error: "phoneNumberId and customerPhone are required." },
      { status: 400 }
    );
  }

  try {
    const botConfig = await db.botConfig.findFirst({
      where: { phoneNumberId },
      select: { tenantId: true },
    });

    if (!botConfig) {
      return NextResponse.json({
        ok: true,
        customerFound: false,
        reason: "TENANT_NOT_FOUND",
      });
    }

    const candidates = new Set<string>();
    const digitsOnly = customerPhone;

    const withCountry = digitsOnly.startsWith("55")
      ? digitsOnly
      : `55${digitsOnly}`;
    const withoutCountry =
      digitsOnly.startsWith("55") && digitsOnly.length > 2
        ? digitsOnly.slice(2)
        : digitsOnly;

    candidates.add(withCountry);
    candidates.add(`+${withCountry}`);
    candidates.add(withoutCountry);
    candidates.add(`+${withoutCountry}`);

    const customer = await db.customer.findFirst({
      where: {
        tenantId: botConfig.tenantId,
        deletedAt: null,
        phone: { in: Array.from(candidates) },
      },
      select: { id: true, optOutAutomations: true },
    });

    if (!customer) {
      return NextResponse.json({ ok: true, customerFound: false });
    }

    if (!customer.optOutAutomations) {
      await db.customer.update({
        where: { id: customer.id },
        data: { optOutAutomations: true },
      });
    }

    return NextResponse.json({
      ok: true,
      customerFound: true,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("[internal/opt-out] erro inesperado", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
