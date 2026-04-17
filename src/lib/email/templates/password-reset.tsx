import { EmailParagraph, EmailShell } from "@/lib/email/templates/components";

type PasswordResetEmailProps = {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailProps) {
  return (
    <EmailShell
      preview="Use este link para redefinir sua senha do Receps."
      title="Redefinir sua senha"
      ctaLabel="Criar nova senha"
      ctaHref={resetUrl}
    >
      <EmailParagraph>
        Olá, {userName}. Recebemos um pedido para redefinir a senha da sua conta no Receps.
      </EmailParagraph>
      <EmailParagraph>
        Este link é válido por <strong>{expiresInMinutes} minutos</strong>. Depois disso,
        será preciso solicitar um novo link na tela de login.
      </EmailParagraph>
      <EmailParagraph>
        Se não foi você, ignore este email — sua senha continua a mesma.
      </EmailParagraph>
    </EmailShell>
  );
}
