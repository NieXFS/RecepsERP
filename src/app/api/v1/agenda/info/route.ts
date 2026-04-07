import { NextResponse } from "next/server";
import { requireAiBotApiKey } from "@/lib/api-auth";
import { agendaInfoQuerySchema } from "@/lib/validators/agenda-api";
import { getAgendaInfoForBot } from "@/services/agenda-api.service";

export async function GET(request: Request) {
  const authError = requireAiBotApiKey(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = agendaInfoQuerySchema.safeParse({
    tenantSlug: searchParams.get("tenantSlug"),
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

  const result = await getAgendaInfoForBot(parsedQuery.data);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
