import { EmailParagraph, EmailShell } from "@/lib/email/templates/components";

type WelcomeEmailProps = {
  userName: string;
  tenantName: string;
};

export function WelcomeEmail({ userName, tenantName }: WelcomeEmailProps) {
  return (
    <EmailShell
      preview="Sua conta Receps foi criada. Agora é hora de configurar o essencial."
      title={`Bem-vindo, ${userName}!`}
      ctaLabel="Continuar configuração"
      ctaHref="https://app.receps.com.br/bem-vindo"
    >
      <EmailParagraph>
        Sua conta do Receps para <strong>{tenantName}</strong> já está pronta.
      </EmailParagraph>
      <EmailParagraph>
        O próximo passo é concluir a configuração inicial para cadastrar serviços,
        profissional principal e horário de atendimento.
      </EmailParagraph>
      <EmailParagraph>
        Isso leva poucos minutos e já deixa sua operação pronta para começar o trial
        com o pé direito.
      </EmailParagraph>
    </EmailShell>
  );
}
