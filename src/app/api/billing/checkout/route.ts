import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral-cookie";
import { createCheckoutSessionSchema } from "@/lib/validators/billing";
import { createTrialSubscription } from "@/services/billing.service";

export async function POST(request: Request) {
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

  const parsedBody = createCheckoutSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues[0]?.message ?? "Dados inválidos.",
      },
      { status: 400 }
    );
  }

  try {
    const cookieStore = await cookies();
    const referralCode =
      parsedBody.data.referralCode ?? cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const subscription = await createTrialSubscription({
      tenantId: user.tenantId,
      planId: parsedBody.data.planId,
      referralCode,
      customerEmail: user.email,
    });

    return NextResponse.json(
      {
        url: subscription.onboardingUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível iniciar seu trial.",
      },
      { status: 400 }
    );
  }
}
