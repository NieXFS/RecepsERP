import { NextResponse } from "next/server";
import { requireAiBotApiKey } from "@/lib/api-auth";
import { availabilityQuerySchema } from "@/lib/validators/agenda-api";
import { getAgendaAvailabilityForBot } from "@/services/agenda-api.service";

export async function GET(request: Request) {
  const authError = requireAiBotApiKey(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = availabilityQuerySchema.safeParse({
    tenantSlug: searchParams.get("tenantSlug"),
    date: searchParams.get("date"),
    serviceId: searchParams.get("serviceId"),
    professionalId: searchParams.get("professionalId") ?? undefined,
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

  const result = await getAgendaAvailabilityForBot(parsedQuery.data);

  if ("error" in result && result.error) {
    const errorMessage = result.error;
    const status =
      errorMessage === "Data inválida."
        ? 400
        : errorMessage.includes("não encontrado")
          ? 404
          : 400;

    return NextResponse.json({ error: errorMessage }, { status });
  }

  return NextResponse.json(result);
}
