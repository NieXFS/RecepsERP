import { EmailParagraph, EmailShell } from "@/lib/email/templates/components";

type TrialEndingEmailProps = {
  userName: string;
  tenantName: string;
};

export function TrialEndingEmail({
  userName,
  tenantName,
}: TrialEndingEmailProps) {
  return (
    <EmailShell
      preview="Seu trial termina em 2 dias. Adicione uma forma de pagamento para continuar."
      title={`${userName}, seu trial está acabando`}
      ctaLabel="Adicionar forma de pagamento"
      ctaHref="https://app.receps.com.br/configuracoes/assinatura"
    >
      <EmailParagraph>
        Faltam 2 dias para o fim do trial da conta <strong>{tenantName}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        Para continuar usando o Receps sem interrupção, adicione uma forma de pagamento
        antes do encerramento do período gratuito.
      </EmailParagraph>
      <EmailParagraph>
        O ajuste é rápido e acontece no portal seguro de cobrança. Se você deixar para
        depois, o acesso pode ser bloqueado quando o trial terminar.
      </EmailParagraph>
    </EmailShell>
  );
}
