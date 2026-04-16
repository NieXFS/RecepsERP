import { EmailParagraph, EmailShell } from "@/lib/email/templates/components";

type PaymentFailedEmailProps = {
  userName: string;
  tenantName: string;
};

export function PaymentFailedEmail({
  userName,
  tenantName,
}: PaymentFailedEmailProps) {
  return (
    <EmailShell
      preview="Não conseguimos processar seu pagamento. Atualize o cartão para evitar bloqueio."
      title={`${userName}, tivemos uma falha no pagamento`}
      ctaLabel="Atualizar pagamento"
      ctaHref="https://app.receps.com.br/api/billing/portal?returnUrl=%2Fconfiguracoes%2Fassinatura"
    >
      <EmailParagraph>
        Não conseguimos processar a cobrança da conta <strong>{tenantName}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        Isso normalmente acontece quando o cartão expirou, foi recusado ou perdeu o
        limite disponível no momento da tentativa.
      </EmailParagraph>
      <EmailParagraph>
        Atualize sua forma de pagamento para evitar bloqueio do acesso e deixar a
        assinatura em dia novamente.
      </EmailParagraph>
    </EmailShell>
  );
}
