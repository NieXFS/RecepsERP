import type { Metadata } from "next";
import { LegalDocument } from "@/components/marketing/legal-document";

const updatedAt = "16 de abril de 2026";

const sections = [
  {
    id: "identificacao",
    title: "1. Identificação da Receps",
    content: (
      <>
        <p>
          Estes Termos de Uso regulam o acesso e a utilização da plataforma Receps,
          operada por Receps Tecnologia Ltda., inscrita no CNPJ 58.184.624/0001-70,
          com atendimento pelo email <a href="mailto:suporte@receps.com.br">suporte@receps.com.br</a>.
        </p>
        <p>
          Ao criar uma conta, contratar um plano ou utilizar qualquer funcionalidade do
          Receps, você declara ter lido e aceitado estes Termos.
        </p>
      </>
    ),
  },
  {
    id: "servico",
    title: "2. Descrição do serviço",
    content: (
      <>
        <p>
          O Receps é um software como serviço (SaaS) voltado para estabelecimentos de
          atendimento, como clínicas de estética, consultórios odontológicos,
          barbearias, salões, centros estéticos e studios de beleza.
        </p>
        <p>
          A plataforma pode incluir agenda, cadastro de clientes, financeiro,
          comissões, estoque, atendimento automatizado no WhatsApp e demais recursos
          previstos no plano contratado.
        </p>
      </>
    ),
  },
  {
    id: "cadastro",
    title: "3. Cadastro e conta",
    content: (
      <>
        <p>
          O titular da conta deve ser maior de 18 anos e ter poderes para representar o
          estabelecimento. O cadastro exige informações verdadeiras, atualizadas e
          completas, incluindo CNPJ válido.
        </p>
        <p>
          Você é responsável por manter a confidencialidade da sua senha, pelo uso da
          sua conta e pelas ações realizadas por usuários vinculados ao seu tenant.
        </p>
        <p>
          O uso de dados falsos, de terceiros sem autorização ou de CNPJ inválido pode
          resultar em suspensão ou encerramento da conta.
        </p>
      </>
    ),
  },
  {
    id: "trial-cobranca",
    title: "4. Trial, cobrança e cancelamento",
    content: (
      <>
        <p>
          O Receps oferece trial gratuito de 7 dias para novos clientes elegíveis. O
          trial pode ser encerrado ao final do período caso nenhuma forma de pagamento
          válida seja adicionada.
        </p>
        <p>
          Se houver cartão cadastrado, a assinatura passa a seguir as regras do plano
          contratado. O cancelamento pode ser feito a qualquer momento pelo portal de
          cobrança, com efeitos conforme o status da assinatura no momento do pedido.
        </p>
        <p>
          Na primeira cobrança paga, o cliente pode solicitar reembolso proporcional em
          até 7 dias corridos, desde que não haja indícios de abuso, fraude ou uso em
          desacordo com estes Termos.
        </p>
      </>
    ),
  },
  {
    id: "uso-aceitavel",
    title: "5. Uso aceitável",
    content: (
      <>
        <p>É proibido utilizar o Receps para:</p>
        <ul>
          <li>envio de spam, fraude, phishing ou conteúdo ilegal;</li>
          <li>violação de direitos de terceiros ou de normas regulatórias aplicáveis;</li>
          <li>engenharia reversa, cópia, scraping ou tentativa de burlar limitações técnicas;</li>
          <li>revenda não autorizada da plataforma ou do acesso aos serviços.</li>
        </ul>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "6. Propriedade intelectual e dados",
    content: (
      <>
        <p>
          O software, a marca Receps, a interface, a documentação e os elementos
          técnicos da plataforma pertencem à Receps ou a seus licenciantes.
        </p>
        <p>
          Os dados inseridos pelo cliente permanecem de titularidade do próprio cliente.
          A Receps trata esses dados para viabilizar a execução do serviço, observada a
          Política de Privacidade e a legislação aplicável.
        </p>
      </>
    ),
  },
  {
    id: "suspensao",
    title: "7. Suspensão e encerramento",
    content: (
      <>
        <p>
          A Receps pode suspender ou encerrar contas em caso de inadimplência, fraude,
          risco à segurança, uso abusivo ou violação destes Termos.
        </p>
        <p>
          Você também pode encerrar o uso da plataforma a qualquer momento, observando
          as regras de cancelamento e retenção mínima de dados fiscais e regulatórios.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "8. Limitação de responsabilidade",
    content: (
      <>
        <p>
          A Receps busca manter disponibilidade-alvo de 99,5%, mas não garante operação
          ininterrupta ou isenta de falhas em todos os momentos.
        </p>
        <p>
          A plataforma não garante aumento de faturamento, redução de churn ou qualquer
          resultado econômico específico do cliente. O cliente continua responsável por
          decisões operacionais, atendimento humano, conformidade regulatória e gestão do
          próprio negócio.
        </p>
      </>
    ),
  },
  {
    id: "lei-foro",
    title: "9. Lei aplicável e foro",
    content: (
      <>
        <p>
          Estes Termos são regidos pela lei brasileira. Fica eleito o foro da comarca da
          sede da Receps para resolver controvérsias decorrentes do uso da plataforma,
          ressalvados os direitos legais do consumidor quando aplicáveis.
        </p>
      </>
    ),
  },
] as const;

export const metadata: Metadata = {
  title: "Termos de Uso | Receps",
  description:
    "Leia os Termos de Uso do Receps, incluindo regras de cadastro, trial, cobrança, cancelamento, uso aceitável e responsabilidade.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      description="Estes termos explicam as regras de acesso, cobrança, responsabilidades e limites do uso da plataforma Receps."
      updatedAt={updatedAt}
      sections={sections}
    />
  );
}
