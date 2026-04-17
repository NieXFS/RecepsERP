import { NextResponse } from "next/server";
import { requestPasswordResetSchema } from "@/lib/validators/password-reset";
import { requestPasswordReset } from "@/services/password-reset.service";

type BucketEntry = { count: number; resetAt: number };
const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60_000;
const rateBuckets = new Map<string, BucketEntry>();

function takeToken(key: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  const ipAddress = clientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!takeToken(ipAddress ?? "anonymous")) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload inválido." },
      { status: 400 }
    );
  }

  const parsed = requestPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Email inválido.",
      },
      { status: 400 }
    );
  }

  try {
    await requestPasswordReset({
      email: parsed.data.email,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("[password-reset/request] falha ao processar:", error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
