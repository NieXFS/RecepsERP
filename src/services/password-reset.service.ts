import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/stripe";
import { sendPasswordResetEmail } from "@/services/email.service";

const TOKEN_TTL_MINUTES = 60;

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

type RequestInput = {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Cria um token de reset e envia o email.
 * Retorna silenciosamente quando o usuário não existe ou está inativo —
 * a resposta visível pela API precisa ser indistinguível para evitar enumeração.
 */
export async function requestPasswordReset({
  email,
  ipAddress,
  userAgent,
}: RequestInput) {
  const normalized = email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      name: true,
      email: true,
      tenantId: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!user || !user.isActive || user.deletedAt) {
    return { ok: true as const };
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    }),
  ]);

  const resetUrl = `${getAppUrl()}/recuperar-senha/${rawToken}`;

  await sendPasswordResetEmail({
    tenantId: user.tenantId,
    userName: user.name,
    recipient: user.email,
    resetUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
  });

  return { ok: true as const };
}

type ConfirmInput = {
  token: string;
  password: string;
};

/**
 * Consome o token de reset, atualiza a senha do usuário e invalida
 * todas as sessões ativas (forçando re-login em outros dispositivos).
 */
export async function confirmPasswordReset({ token, password }: ConfirmInput) {
  const tokenHash = hashToken(token);

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });

  if (
    !record ||
    record.usedAt ||
    record.expiresAt.getTime() <= Date.now() ||
    !record.user ||
    !record.user.isActive ||
    record.user.deletedAt
  ) {
    throw new Error("Link inválido ou expirado.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.session.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return { email: record.user.email };
}
