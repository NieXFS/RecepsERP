import { NextResponse } from "next/server";
import { listActivePlans } from "@/services/billing.service";

export async function GET() {
  const plans = await listActivePlans();

  return NextResponse.json(
    plans.map((plan) => ({
      ...plan,
      priceMonthly: Number(plan.priceMonthly),
    }))
  );
}
