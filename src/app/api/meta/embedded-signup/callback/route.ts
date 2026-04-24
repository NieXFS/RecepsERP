import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  exchangeCodeForToken,
  isPhoneNumberRegisteredInAnotherAppError,
  registerPhoneNumber,
  subscribeAppToWaba,
} from "@/lib/meta-graph";
import { requireAuth } from "@/lib/session";
import { connectBotConfigViaEmbeddedSignup } from "@/services/bot-config.service";

const embeddedSignupCallbackSchema = z.object({
  code: z.string().trim().min(1, "code é obrigatório."),
  wabaId: z.string().trim().min(1, "wabaId é obrigatório."),
  phoneNumberId: z.string().trim().min(1, "phoneNumberId é obrigatório."),
});

function getMetaEmbeddedSignupEnv() {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const apiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v21.0";
  const redirectUri = process.env.META_EMBEDDED_SIGNUP_REDIRECT_URI?.trim();

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return {
    appId,
    appSecret,
    apiVersion,
    redirectUri,
  };
}

export async function POST(request: Request) {
  if (process.env.META_EMBEDDED_SIGNUP_ENABLED !== "true") {
    return NextResponse.json({ error: "Feature desativada." }, { status: 403 });
  }

  let user;

  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const parsedBody = embeddedSignupCallbackSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Body inválido.",
        details: parsedBody.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const env = getMetaEmbeddedSignupEnv();

  if (!env) {
    console.error("[meta-embedded-signup] configuração obrigatória ausente no servidor.");
    return NextResponse.json(
      { error: "Integração Meta indisponível no momento." },
      { status: 500 }
    );
  }

  try {
    const { accessToken } = await exchangeCodeForToken({
      apiVersion: env.apiVersion,
      appId: env.appId,
      appSecret: env.appSecret,
      code: parsedBody.data.code,
      redirectUri: env.redirectUri,
    });

    const registrationPin = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const persisted = await connectBotConfigViaEmbeddedSignup(user.tenantId, {
      wabaId: parsedBody.data.wabaId,
      phoneNumberId: parsedBody.data.phoneNumberId,
      waAccessToken: accessToken,
      waApiVersion: env.apiVersion,
      waRegistrationPin: registrationPin,
    });

    if (!persisted.success) {
      return NextResponse.json({ error: persisted.error }, { status: 400 });
    }

    void subscribeAppToWaba({
      apiVersion: env.apiVersion,
      wabaId: parsedBody.data.wabaId,
      accessToken,
    }).catch((error) => {
      console.warn(
        `[meta-embedded-signup] falha ao inscrever o app na WABA tenant=${user.tenantId} wabaId=${parsedBody.data.wabaId}`,
        error
      );
    });

    void registerPhoneNumber({
      apiVersion: env.apiVersion,
      phoneNumberId: parsedBody.data.phoneNumberId,
      accessToken,
      pin: registrationPin,
    }).catch((error) => {
      if (isPhoneNumberRegisteredInAnotherAppError(error)) {
        console.warn(
          `[meta-embedded-signup] número já registrado em outro app tenant=${user.tenantId} phoneNumberId=${parsedBody.data.phoneNumberId}`
        );
        return;
      }

      console.warn(
        `[meta-embedded-signup] falha ao registrar o número tenant=${user.tenantId} phoneNumberId=${parsedBody.data.phoneNumberId}`,
        error
      );
    });

    revalidatePath("/atendente-ia");

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível concluir a conexão com a Meta.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
