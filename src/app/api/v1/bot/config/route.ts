import { NextResponse } from "next/server";
import { requireAiBotApiKey } from "@/lib/api-auth";
import { botConfigByPhoneNumberQuerySchema } from "@/lib/validators/bot-config";
import { getBotConfigByPhoneNumberId } from "@/services/bot-config.service";

export async function GET(request: Request) {
  const authError = requireAiBotApiKey(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = botConfigByPhoneNumberQuerySchema.safeParse({
    phoneNumberId: searchParams.get("phoneNumberId"),
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parâmetros inválidos.",
        details: parsedQuery.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const botConfig = await getBotConfigByPhoneNumberId(parsedQuery.data.phoneNumberId);

  if (!botConfig) {
    return NextResponse.json(
      { error: "Bot não encontrado ou inativo para esse número." },
      { status: 404 }
    );
  }

  return NextResponse.json(botConfig);
}
