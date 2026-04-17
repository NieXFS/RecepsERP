import React from "react";
import { render } from "@react-email/render";
import { subDays, subHours } from "date-fns";
import { db } from "@/lib/db";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "@/lib/email/client";
import { PasswordResetEmail } from "@/lib/email/templates/password-reset";
import { PaymentFailedEmail } from "@/lib/email/templates/payment-failed";
import { TrialEndingEmail } from "@/lib/email/templates/trial-ending";
import { WelcomeEmail } from "@/lib/email/templates/welcome";

type EmailTemplateName = "welcome" | "trial-ending" | "payment-failed" | "password-reset";

type RecipientContext = {
  tenantId: string;
  tenantName: string;
  userName: string;
  recipient: string;
};

async function getRecipientContext(tenantId: string): Promise<RecipientContext | null> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      users: {
        where: {
          isActive: true,
          deletedAt: null,
          role: "ADMIN",
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          name: true,
          email: true,
        },
        take: 1,
      },
    },
  });

  if (!tenant) {
    return null;
  }

  const admin = tenant.users[0];
  const recipient = admin?.email ?? tenant.email ?? null;

  if (!recipient) {
    return null;
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    userName: admin?.name ?? tenant.name,
    recipient,
  };
}

async function createEmailLog(input: {
  tenantId: string;
  template: EmailTemplateName;
  recipient: string;
  status: string;
  providerId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  return db.emailLog.create({
    data: {
      tenantId: input.tenantId,
      template: input.template,
      recipient: input.recipient,
      status: input.status,
      providerId: input.providerId ?? null,
      error: input.error ?? null,
      sentAt: input.sentAt ?? null,
    },
  });
}

async function wasRecentlySent(
  tenantId: string,
  template: EmailTemplateName,
  since: Date
) {
  const existing = await db.emailLog.findFirst({
    where: {
      tenantId,
      template,
      status: "SENT",
      createdAt: {
        gte: since,
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function sendEmail(options: {
  tenantId: string;
  template: EmailTemplateName;
  subject: string;
  recipient: string;
  react: React.ReactElement;
}) {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] Resend não configurado — pulando envio do template "${options.template}".`
    );
    await createEmailLog({
      tenantId: options.tenantId,
      template: options.template,
      recipient: options.recipient,
      status: "SKIPPED",
      error: "Resend não configurado no ambiente.",
    });
    return { success: false as const, error: "email_not_configured" };
  }

  const resend = getResendClient();

  if (!resend) {
    await createEmailLog({
      tenantId: options.tenantId,
      template: options.template,
      recipient: options.recipient,
      status: "SKIPPED",
      error: "Cliente Resend indisponível.",
    });
    return { success: false as const, error: "resend_client_unavailable" };
  }

  try {
    const html = await render(options.react);
    const response = await resend.emails.send({
      from: getEmailFrom(),
      to: options.recipient,
      replyTo: getEmailReplyTo(),
      subject: options.subject,
      html,
    });

    await createEmailLog({
      tenantId: options.tenantId,
      template: options.template,
      recipient: options.recipient,
      status: "SENT",
      providerId: response.data?.id ?? null,
      sentAt: new Date(),
    });

    return { success: true as const, providerId: response.data?.id ?? null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao enviar email transacional.";

    await createEmailLog({
      tenantId: options.tenantId,
      template: options.template,
      recipient: options.recipient,
      status: "FAILED",
      error: message,
    });

    return { success: false as const, error: message };
  }
}

export async function sendWelcomeEmail(tenantId: string) {
  const alreadySent = await db.emailLog.findFirst({
    where: {
      tenantId,
      template: "welcome",
      status: "SENT",
    },
    select: { id: true },
  });

  if (alreadySent) {
    return { success: false as const, error: "welcome_already_sent" };
  }

  const context = await getRecipientContext(tenantId);

  if (!context) {
    return { success: false as const, error: "missing_recipient" };
  }

  return sendEmail({
    tenantId,
    template: "welcome",
    subject: "Bem-vindo à Receps — vamos configurar sua conta",
    recipient: context.recipient,
    react: React.createElement(WelcomeEmail, {
      userName: context.userName,
      tenantName: context.tenantName,
    }),
  });
}

export async function sendTrialEndingEmail(tenantId: string) {
  const recentlySent = await wasRecentlySent(tenantId, "trial-ending", subDays(new Date(), 7));

  if (recentlySent) {
    return { success: false as const, error: "trial_ending_recently_sent" };
  }

  const context = await getRecipientContext(tenantId);

  if (!context) {
    return { success: false as const, error: "missing_recipient" };
  }

  return sendEmail({
    tenantId,
    template: "trial-ending",
    subject: "Seu trial termina em 2 dias",
    recipient: context.recipient,
    react: React.createElement(TrialEndingEmail, {
      userName: context.userName,
      tenantName: context.tenantName,
    }),
  });
}

export async function sendPaymentFailedEmail(tenantId: string) {
  const recentlySent = await wasRecentlySent(
    tenantId,
    "payment-failed",
    subHours(new Date(), 24)
  );

  if (recentlySent) {
    return { success: false as const, error: "payment_failed_recently_sent" };
  }

  const context = await getRecipientContext(tenantId);

  if (!context) {
    return { success: false as const, error: "missing_recipient" };
  }

  return sendEmail({
    tenantId,
    template: "payment-failed",
    subject: "Não conseguimos processar seu pagamento",
    recipient: context.recipient,
    react: React.createElement(PaymentFailedEmail, {
      userName: context.userName,
      tenantName: context.tenantName,
    }),
  });
}

type SendPasswordResetInput = {
  tenantId: string;
  userName: string;
  recipient: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetEmail({
  tenantId,
  userName,
  recipient,
  resetUrl,
  expiresInMinutes,
}: SendPasswordResetInput) {
  return sendEmail({
    tenantId,
    template: "password-reset",
    subject: "Redefinir sua senha do Receps",
    recipient,
    react: React.createElement(PasswordResetEmail, {
      userName,
      resetUrl,
      expiresInMinutes,
    }),
  });
}
