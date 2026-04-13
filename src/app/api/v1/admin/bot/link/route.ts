import { NextResponse } from "next/server";
import { requireAdminSecretKey } from "@/lib/api-auth";
import { adminBotLinkSchema } from "@/lib/validators/bot-config";
import { linkBotConfigToTenant } from "@/services/bot-config.service";

export async function POST(request: Request) {
  const authError = requireAdminSecretKey(request);
  if (authError) {
    return authError;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsedBody = adminBotLinkSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Body inválido.",
        details: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const result = await linkBotConfigToTenant(parsedBody.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tenantSlug: result.data.tenantSlug,
    phoneNumberId: result.data.phoneNumberId,
  });
}
