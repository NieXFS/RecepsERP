import { NextResponse } from "next/server";

/**
 * Verifica a API key estática usada pelo bot externo de WhatsApp.
 * As rotas da IA não dependem do NextAuth; a autenticação é feita
 * exclusivamente via Authorization: Bearer <AI_BOT_API_KEY>.
 */
export function requireAiBotApiKey(request: Request) {
  const configuredApiKey = process.env.AI_BOT_API_KEY;

  if (!configuredApiKey) {
    return NextResponse.json(
      {
        error:
          "Integração da IA indisponível: AI_BOT_API_KEY não configurada no ambiente.",
      },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token || token !== configuredApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
