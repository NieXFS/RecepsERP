import type { Metadata } from "next";
import { LegalDocument } from "@/components/marketing/legal-document";

const updatedAt = "16 de abril de 2026";

const sections = [
  {
    id: "quem-somos",
    title: "1. Quem somos",
    content: (
      <>
        <p>
          A Receps Tecnologia Ltda., CNPJ 58.184.624/0001-70, é a controladora dos dados
          pessoais tratados para prestação do serviço Receps. Para assuntos de
          privacidade, fale com{" "}
          <a href="mailto:privacidade@receps.com.br">privacidade@receps.com.br</a>.
        </p>
        <p>
          Quando um tenant insere dados de seus clientes finais na plataforma, a Receps
          atua como operadora desses dados, tratando-os em nome do tenant.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "2. Quais dados coletamos",
    content: (
      <>
        <p>Coletamos as seguintes categorias de dados:</p>
        <ul>
          <li>cadastro: nome, email, telefone, CNPJ, cargo e dados do negócio;</li>
          <li>uso da plataforma: logs, IP, navegador, dispositivo, timestamps e páginas acessadas;</li>
          <li>cobrança: identificadores de assinatura e cliente Stripe; não armazenamos cartão;</li>
          <li>dados de clientes finais inseridos pelo tenant para agenda, histórico e atendimento.</li>
        </ul>
      </>
    ),
  },
  {
    id: "bases-legais",
    title: "3. Bases legais e finalidades",
    content: (
      <>
        <p>
          Tratamos dados com base na execução de contrato, legítimo interesse e, quando
          aplicável, consentimento para comunicações de marketing e cookies não
          necessários.
        </p>
        <p>
          As finalidades incluem cadastro, autenticação, cobrança, suporte, prevenção a
          fraude, segurança, evolução do produto e cumprimento de obrigações legais e
          fiscais.
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento de dados",
    content: (
      <>
        <p>Podemos compartilhar dados com:</p>
        <ul>
          <li>Stripe, para cobrança e gestão de assinatura;</li>
          <li>ferramentas de email transacional, para envios operacionais do serviço;</li>
          <li>Meta e Google, somente após consentimento para cookies analíticos ou de marketing;</li>
          <li>autoridades públicas, quando exigido por lei ou ordem válida.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "5. Cookies",
    content: (
      <>
        <p>
          Utilizamos cookies necessários para autenticação, segurança e funcionamento do
          site. Cookies analíticos e de marketing só são ativados mediante consentimento.
        </p>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Finalidade</th>
              <th>Retenção</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>receps_cookie_consent</td>
              <td>Necessário</td>
              <td>Guardar sua escolha sobre cookies</td>
              <td>1 ano</td>
            </tr>
            <tr>
              <td>receps_ref</td>
              <td>Necessário</td>
              <td>Preservar código de indicação durante navegação pública</td>
              <td>30 dias</td>
            </tr>
            <tr>
              <td>_ga / _fbp</td>
              <td>Analítico / marketing</td>
              <td>Mensuração de campanhas e uso do site, quando autorizado</td>
              <td>Até 24 meses</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "direitos",
    title: "6. Direitos do titular",
    content: (
      <>
        <p>
          Nos termos do art. 18 da LGPD, você pode solicitar acesso, correção,
          anonimização, portabilidade, eliminação, informação sobre compartilhamento e
          revogação de consentimento.
        </p>
        <p>
          Para exercer seus direitos, envie sua solicitação para{" "}
          <a href="mailto:privacidade@receps.com.br">privacidade@receps.com.br</a>.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "7. Retenção",
    content: (
      <>
        <p>
          Mantemos dados da conta enquanto ela estiver ativa e por até 5 anos após o
          encerramento, quando necessário para defesa, auditoria, obrigações fiscais e
          regulatórias. Dados fiscais podem ser retidos por 5 anos ou pelo prazo legal
          aplicável.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "8. Segurança",
    content: (
      <>
        <p>
          Adotamos medidas técnicas e organizacionais como criptografia em trânsito e em
          repouso, segregação de dados por tenant, autenticação e controle de acesso por
          perfil de usuário.
        </p>
      </>
    ),
  },
  {
    id: "transferencia-internacional",
    title: "9. Transferência internacional",
    content: (
      <>
        <p>
          Alguns fornecedores, como a Stripe, podem tratar dados fora do Brasil,
          inclusive nos Estados Unidos. Nessas hipóteses, adotamos mecanismos
          contratuais e salvaguardas adequadas para proteger os dados pessoais.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "10. Alterações desta política",
    content: (
      <>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. Quando houver
          mudanças relevantes, publicaremos a nova versão nesta página com a data de
          atualização correspondente.
        </p>
      </>
    ),
  },
] as const;

export const metadata: Metadata = {
  title: "Política de Privacidade | Receps",
  description:
    "Entenda como a Receps coleta, trata, compartilha e protege dados pessoais em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      description="Aqui explicamos quais dados tratamos, por quê, com quem compartilhamos e como você pode exercer seus direitos como titular."
      updatedAt={updatedAt}
      sections={sections}
    />
  );
}
