import { NextResponse } from "next/server";

function requireBearerEnvToken(
  request: Request,
  envVarName: string,
  missingMessage: string
) {
  const configuredToken = process.env[envVarName];

  if (!configuredToken) {
    return NextResponse.json(
      { error: missingMessage },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token || token !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * Verifica a API key estática usada pelo bot externo de WhatsApp.
 * As rotas da IA não dependem do NextAuth; a autenticação é feita
 * exclusivamente via Authorization: Bearer <AI_BOT_API_KEY>.
 */
export function requireAiBotApiKey(request: Request) {
  return requireBearerEnvToken(
    request,
    "AI_BOT_API_KEY",
    "Integração da IA indisponível: AI_BOT_API_KEY não configurada no ambiente."
  );
}

export function requireAdminSecretKey(request: Request) {
  return requireBearerEnvToken(
    request,
    "ADMIN_SECRET_KEY",
    "Integração administrativa indisponível: ADMIN_SECRET_KEY não configurada no ambiente."
  );
}
