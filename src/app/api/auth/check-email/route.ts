import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const querySchema = z.object({
  email: z.string().trim().email("Email inválido.").transform((value) => value.toLowerCase()),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: url.searchParams.get("email") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        exists: false,
        error: parsed.error.issues[0]?.message ?? "Email inválido.",
      },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  return NextResponse.json({
    exists: Boolean(user),
  });
}
