import { Resend } from "resend";

let resendClient: Resend | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Receps <oi@receps.com.br>";
}

export function getEmailReplyTo() {
  return process.env.EMAIL_REPLY_TO?.trim() || "suporte@receps.com.br";
}

export function getResendClient() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!.trim());
  }

  return resendClient;
}
