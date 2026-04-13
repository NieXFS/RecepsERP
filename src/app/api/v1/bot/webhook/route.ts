import { NextResponse } from "next/server";
import { extractPhoneNumberIdFromWebhookPayload, forwardBotWebhookPayload } from "@/services/bot-webhook.service";
import { getBotConfigByPhoneNumberId, hasActiveBotVerifyToken } from "@/services/bot-config.service";

function isValidWebhookVerificationToken(token: string) {
  const globalToken = process.env.WA_GLOBAL_VERIFY_TOKEN;
  return Boolean(globalToken && token === globalToken);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !verifyToken || !challenge) {
    return NextResponse.json({ error: "Parâmetros de verificação inválidos." }, { status: 400 });
  }

  if (isValidWebhookVerificationToken(verifyToken)) {
    return new NextResponse(challenge, { status: 200 });
  }

  if (await hasActiveBotVerifyToken(verifyToken)) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Token de verificação inválido." }, { status: 403 });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const phoneNumberId = extractPhoneNumberIdFromWebhookPayload(body);

  if (!phoneNumberId) {
    return NextResponse.json({ ok: true });
  }

  const botConfig = await getBotConfigByPhoneNumberId(phoneNumberId);

  if (!botConfig) {
    return NextResponse.json({ ok: true });
  }

  queueMicrotask(() => {
    void forwardBotWebhookPayload(body);
  });

  return NextResponse.json({ ok: true });
}
