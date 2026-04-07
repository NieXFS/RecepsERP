import { NextResponse } from "next/server";
import { requireAiBotApiKey } from "@/lib/api-auth";
import { bookAppointmentApiSchema } from "@/lib/validators/agenda-api";
import { bookAppointmentForBot } from "@/services/agenda-api.service";

export async function POST(request: Request) {
  const authError = requireAiBotApiKey(request);
  if (authError) {
    return authError;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsedBody = bookAppointmentApiSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Body inválido.",
        details: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const result = await bookAppointmentForBot(parsedBody.data);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
