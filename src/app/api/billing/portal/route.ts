import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { createBillingPortalSessionSchema } from "@/lib/validators/billing";
import { createBillingPortalSession } from "@/services/billing.service";

export async function GET(request: Request) {
  let user;

  try {
    user = await requireAuth();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl") || "/configuracoes/assinatura";
    const session = await createBillingPortalSession(user.tenantId, returnUrl);

    return NextResponse.redirect(session.url);
  } catch {
    return NextResponse.redirect(new URL("/configuracoes/assinatura", request.url));
  }
}

export async function POST(request: Request) {
  let user;

  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown = {};

  try {
    const rawBody = await request.text();
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsedBody = createBillingPortalSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 400 }
    );
  }

  try {
    const session = await createBillingPortalSession(
      user.tenantId,
      parsedBody.data.returnUrl
    );

    return NextResponse.json(
      {
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível abrir o portal de cobrança.",
      },
      { status: 400 }
    );
  }
}
