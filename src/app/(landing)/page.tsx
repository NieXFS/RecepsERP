import Image from "next/image";
import Script from "next/script";
import { ContactForm } from "./_contact-form";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from "./_icons";
import { RoiCalculator } from "./_roi-calculator";

type FaqItem = { q: string; a: string };

const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    q: "Preciso ter um WhatsApp Business separado?",
    // TODO(victor): confirmar se usamos WhatsApp Cloud API oficial ou número pessoal/Business App. Ajustar copy conforme.
    a: "Sim, recomendamos um número dedicado ao negócio para manter o histórico profissional separado do pessoal. A configuração é feita junto com nossa equipe no onboarding e funciona com WhatsApp Business normal — você não precisa trocar de número se o que usa hoje já é do negócio.",
  },
  {
    q: "A IA aprende o jeito de atender da minha clínica?",
    a: "Sim. No onboarding, a IA é treinada com seu cardápio de serviços, política de agendamento, horários, regras de confirmação, tom de voz e respostas para dúvidas comuns. Você pode ajustar a qualquer momento pelo painel e ver como ela responderia antes de entrar em produção.",
  },
  {
    q: "Posso migrar dados do meu sistema atual?",
    a: "Sim. Importamos clientes, serviços, profissionais, histórico de agendamentos e saldos financeiros via planilha ou integração direta. Nossa equipe faz a migração por você nos planos anuais e acompanha a primeira semana pra garantir que nada ficou para trás.",
  },
  {
    q: "Meus dados e dos meus clientes estão seguros? LGPD?",
    a: "Sim. O Receps segue a LGPD: dados criptografados em trânsito e em repouso, controle de acesso por perfil, trilha de auditoria nas ações críticas e possibilidade de exportação e exclusão a pedido do titular. Não vendemos dados e não usamos conversas dos seus clientes para treinar IAs de terceiros.",
  },
  {
    q: "O que acontece depois dos 7 dias grátis?",
    a: "Nada some de um dia pro outro. Você recebe lembretes antes do fim do período e, se decidir assinar, o plano entra ativo automaticamente. Se não quiser continuar, a conta fica em modo leitura por mais 30 dias pra você exportar tudo com calma.",
  },
  {
    q: "Tem contrato de fidelidade ou multa?",
    a: "Não. A assinatura é mensal e você cancela pelo próprio painel quando quiser, sem multa e sem burocracia. Planos anuais têm desconto, mas também aceitam cancelamento proporcional.",
  },
  {
    q: "Funciona pra qual tipo de negócio?",
    a: "Clínicas de estética, consultórios odontológicos, barbearias, salões de beleza, centros estéticos e estúdios de tattoo, pilates e fisioterapia. Qualquer negócio de serviços com agenda, profissionais e atendimento via WhatsApp se encaixa bem.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Suporte por WhatsApp em horário comercial para todos os planos, com prioridade no plano Atendente + ERP. Chamados críticos são respondidos em minutos. Onboarding assistido é incluso e o time acompanha o primeiro mês de uso de perto.",
  },
];

type ComparisonState = "yes" | "partial" | "no";
type ComparisonRow = {
  label: string;
  sheet: ComparisonState;
  legacy: ComparisonState;
  receps: ComparisonState;
};

const COMPARISON_ROWS: ReadonlyArray<ComparisonRow> = [
  { label: "Agendamento direto pelo WhatsApp", sheet: "no", legacy: "partial", receps: "yes" },
  { label: "IA que atende 24h no WhatsApp", sheet: "no", legacy: "no", receps: "yes" },
  { label: "Comissões calculadas automaticamente", sheet: "no", legacy: "yes", receps: "yes" },
  { label: "Fluxo de caixa e DRE em tempo real", sheet: "partial", legacy: "yes", receps: "yes" },
  { label: "Controle de estoque integrado", sheet: "no", legacy: "partial", receps: "yes" },
  { label: "Relatórios e dashboards visuais", sheet: "no", legacy: "partial", receps: "yes" },
  { label: "Onboarding assistido incluso", sheet: "no", legacy: "partial", receps: "yes" },
  { label: "Suporte por WhatsApp", sheet: "no", legacy: "no", receps: "yes" },
];

function comparisonCell(state: ComparisonState) {
  if (state === "yes") {
    return (
      <span className="comparison-icon comparison-icon-yes" aria-label="Sim">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (state === "partial") {
    return (
      <span className="comparison-icon comparison-icon-partial" aria-label="Parcial">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="comparison-icon comparison-icon-no" aria-label="Não">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </span>
  );
}

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

/**
 * Landing page da Receps (rota /).
 * Porte direto do SiteReceps/index.html. Estilos em src/styles/landing.css
 * (scoped com .receps-landing). Interatividade em public/landing-script.js.
 */
export default function LandingPage() {
  return (
    <div className="receps-landing">
      {/* NAVBAR */}
      <nav className="navbar" id="navbar">
        <div className="nav-inner">
          <a href="/" className="nav-logo" aria-label="Receps">
            <Image
              src="/landing-wordmark.svg"
              alt="Receps"
              width={853}
              height={228}
              className="nav-logo-img"
              style={{ height: 28, width: "auto", display: "block" }}
              unoptimized
              priority
            />
          </a>
          <div className="nav-links" id="navLinks">
            <div className="nav-dropdown">
              <button
                type="button"
                className="nav-dropdown-trigger"
                aria-haspopup="true"
              >
                Produtos
                <ChevronDownIcon size={12} />
              </button>
              <div className="nav-dropdown-menu">
                <a href="/atendentes-ia" className="nav-dropdown-item">
                  <strong>Atendente IA</strong>
                  <span>IA que atende no WhatsApp 24h</span>
                </a>
                <a href="/erp" className="nav-dropdown-item">
                  <strong>ERP Financeiro</strong>
                  <span>Gestão completa da clínica</span>
                </a>
                <a href="/erp-atendente-ia" className="nav-dropdown-item">
                  <strong>ERP + Atendente IA</strong>
                  <span>Solução completa integrada</span>
                </a>
              </div>
            </div>
            <a href="#features">Funcionalidades</a>
            <a href="#how-it-works">Como Funciona</a>
            <a href="#pricing">Planos</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="nav-actions">
            <a href="https://app.receps.com.br/login" className="nav-login">
              Entrar
            </a>
            <a href="/erp-atendente-ia" className="btn btn-primary btn-nav">
              Começar
              <span className="btn-icon-wrap">
                <ArrowRightIcon size={16} />
              </span>
            </a>
            <button className="nav-hamburger" id="hamburger" aria-label="Menu">
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="mobile-menu" id="mobileMenu">
          <div className="mobile-menu-inner">
            <div className="mobile-menu-group">
              <span className="mobile-menu-label">Produtos</span>
              <a href="/atendentes-ia" className="mobile-link mobile-sublink">
                Atendente IA
              </a>
              <a href="/erp" className="mobile-link mobile-sublink">
                ERP Financeiro
              </a>
              <a href="/erp-atendente-ia" className="mobile-link mobile-sublink">
                ERP + Atendente IA
              </a>
            </div>
            <a href="#features" className="mobile-link">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="mobile-link">
              Como Funciona
            </a>
            <a href="#pricing" className="mobile-link">
              Planos
            </a>
            <a href="#contato" className="mobile-link">
              Contato
            </a>
            <a href="https://app.receps.com.br/login" className="mobile-link">
              Entrar
            </a>
            <a href="/erp-atendente-ia" className="btn btn-primary btn-mobile-cta">
              Começar
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1 className="hero-title reveal">
          Seu negócio no
          <br />
          <span className="hero-accent">piloto automático.</span>
        </h1>
        <p className="hero-subtitle reveal">
          O Receps é o sistema de gestão premium que une um ERP financeiro completo a uma
          Inteligência Artificial no WhatsApp. Feito para clínicas de estética,
          consultórios odontológicos, barbearias, salões, centros estéticos e
          estúdios que querem lotar a agenda, fechar o caixa e calcular comissões
          sem depender de planilha.
        </p>
        <div className="hero-ctas reveal">
          <a href="/erp-atendente-ia" className="btn btn-primary btn-lg">
            Testar grátis por 7 dias
            <span className="btn-icon-wrap">
              <ArrowRightIcon size={18} />
            </span>
          </a>
          <a href="#how-it-works" className="btn btn-ghost btn-lg">
            Como funciona
          </a>
        </div>
        <ul className="hero-trust reveal" aria-label="Diferenciais">
          <li>
            <CheckIcon size={14} strokeWidth={2.5} />
            Sem cartão de crédito
          </li>
          <li>
            <CheckIcon size={14} strokeWidth={2.5} />
            Configuração em 15 min
          </li>
          <li>
            <CheckIcon size={14} strokeWidth={2.5} />
            Suporte por WhatsApp
          </li>
        </ul>
        <div className="hero-visual reveal">
          <div className="hero-mockup">
            <div className="mockup-topbar">
              <div className="mockup-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="mockup-title">Receps — Dashboard</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-nav-item active" />
                <div className="mockup-nav-item" />
                <div className="mockup-nav-item" />
                <div className="mockup-nav-item" />
                <div className="mockup-nav-item" />
              </div>
              <div className="mockup-content">
                <div className="mockup-stats">
                  <div className="mockup-stat-card">
                    <span className="stat-label">Agendamentos Hoje</span>
                    <span className="stat-value">24</span>
                    <span className="stat-badge up">+18%</span>
                  </div>
                  <div className="mockup-stat-card">
                    <span className="stat-label">Faturamento Mensal</span>
                    <span className="stat-value">R$ 47.2k</span>
                    <span className="stat-badge up">+23%</span>
                  </div>
                  <div className="mockup-stat-card">
                    <span className="stat-label">Atendimentos IA</span>
                    <span className="stat-value">312</span>
                    <span className="stat-badge up">+45%</span>
                  </div>
                </div>
                <div className="mockup-chart">
                  <div className="chart-bars">
                    <div className="chart-bar" style={{ height: "40%" }} />
                    <div className="chart-bar" style={{ height: "65%" }} />
                    <div className="chart-bar" style={{ height: "45%" }} />
                    <div className="chart-bar" style={{ height: "80%" }} />
                    <div className="chart-bar" style={{ height: "55%" }} />
                    <div className="chart-bar" style={{ height: "90%" }} />
                    <div
                      className="chart-bar active"
                      style={{ height: "95%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-whatsapp-float">
            <div className="wa-bubble">
              <div className="wa-header">
                <div className="wa-avatar">IA</div>
                <span>Receps IA</span>
              </div>
              <div className="wa-messages">
                <div className="wa-msg incoming">
                  Olá! Gostaria de agendar uma limpeza de pele 🧖‍♀️
                </div>
                <div className="wa-msg outgoing">
                  Claro! Temos horários disponíveis amanhã às 10h, 14h ou 16h.
                  Qual prefere? 😊
                </div>
                <div className="wa-msg incoming">14h por favor!</div>
                <div className="wa-msg outgoing">
                  Perfeito! ✅ Agendado para amanhã às 14h. Enviarei um lembrete!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE — para quem é */}
      <section className="audience" id="para-quem-e">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Para quem é</span>
            <h2 className="section-title">
              Feito pra quem cuida de
              <br />
              <span className="text-accent">pessoas no dia a dia.</span>
            </h2>
            <p className="section-subtitle">
              Negócios de beleza, saúde e bem-estar têm fluxo de atendimento
              próprio. O Receps foi desenhado pra cada um deles.
            </p>
          </div>

          <div className="audience-grid reveal">
            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
                  <path d="M5 14a7 7 0 0 0 14 0" />
                  <path d="M12 21v-7" />
                </svg>
              </div>
              <h3 className="audience-title">Clínicas de Estética</h3>
              <p className="audience-subtitle">
                Botox, harmonização, limpeza de pele, protocolos.
              </p>
              <ul className="audience-features">
                <li>Pacotes e sessões controlados</li>
                <li>Ficha de anamnese no prontuário</li>
                <li>Comissão por procedimento</li>
              </ul>
            </article>

            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5.5C8 2 2 3 2 9c0 3 2 6 4 9 1.5 2 3 2 3.5.5s.5-3 2.5-3 2 1.5 2.5 3S16 20 17.5 18c2-3 4.5-6 4.5-9 0-6-6-7-10-3.5Z" />
                </svg>
              </div>
              <h3 className="audience-title">Consultórios Odontológicos</h3>
              <p className="audience-subtitle">
                Implantes, ortodontia, clínica geral.
              </p>
              <ul className="audience-features">
                <li>Plano de tratamento parcelado</li>
                <li>Lembretes de retorno automáticos</li>
                <li>Dashboard por dentista</li>
              </ul>
            </article>

            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="m8 6 12 6" />
                  <path d="m8 18 12-6" />
                  <path d="M14.5 9 20 4" />
                </svg>
              </div>
              <h3 className="audience-title">Barbearias</h3>
              <p className="audience-subtitle">
                Corte, barba, combo e fidelização.
              </p>
              <ul className="audience-features">
                <li>Agenda por cadeira/barbeiro</li>
                <li>Cashback e clube de assinatura</li>
                <li>Fila de espera no WhatsApp</li>
              </ul>
            </article>

            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 21c0-4.4 2-8 5-8s5 3.6 5 8" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M8 10c-2 1-3 3-3 5" />
                  <path d="M16 10c2 1 3 3 3 5" />
                </svg>
              </div>
              <h3 className="audience-title">Salões de Beleza</h3>
              <p className="audience-subtitle">
                Cabelo, unha, depilação, maquiagem.
              </p>
              <ul className="audience-features">
                <li>Comissão por profissional e serviço</li>
                <li>Controle de produtos de revenda</li>
                <li>Cliente escolhe o profissional no chat</li>
              </ul>
            </article>

            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <h3 className="audience-title">Centros Estéticos</h3>
              <p className="audience-subtitle">
                Multimarcas, multiprofissionais, múltiplas salas.
              </p>
              <ul className="audience-features">
                <li>Gestão de salas e equipamentos</li>
                <li>Metas por unidade</li>
                <li>Relatórios consolidados</li>
              </ul>
            </article>

            <article className="audience-card">
              <div className="audience-icon" aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v6" />
                  <path d="M5 11h14" />
                  <path d="M6 11v4a6 6 0 0 0 12 0v-4" />
                  <path d="M9 21h6" />
                </svg>
              </div>
              <h3 className="audience-title">Estúdios</h3>
              <p className="audience-subtitle">
                Tattoo, pilates, fisioterapia, personal.
              </p>
              <ul className="audience-features">
                <li>Pacotes, créditos e sessões recorrentes</li>
                <li>Assinaturas mensais automáticas</li>
                <li>Integração com WhatsApp para confirmação</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Funcionalidades</span>
            <h2 className="section-title">
              Tudo que seu negócio precisa.
              <br />
              <span className="text-accent">Nada que ele não precisa.</span>
            </h2>
            <p className="section-subtitle">
              Duas forças trabalhando juntas para clínicas, consultórios,
              barbearias, salões, centros estéticos e estúdios: um ERP que
              organiza a operação e uma IA que lota sua agenda pelo WhatsApp.
            </p>
          </div>

          <div className="bento-grid reveal">
            <div className="bento-card bento-large bento-ai">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="bento-title">Atendente IA no WhatsApp</h3>
                <p className="bento-desc">
                  Sua recepcionista virtual que nunca dorme. Atende clientes,
                  agenda horários, envia lembretes e responde dúvidas — tudo de
                  forma natural, 24 horas por dia, 7 dias por semana.
                </p>
                <div className="bento-visual-ai">
                  <div className="ai-chat-demo">
                    <div className="ai-line incoming">
                      <span>Quero agendar um botox para sexta</span>
                    </div>
                    <div className="ai-line outgoing">
                      <span>Temos às 9h, 11h e 15h. Qual prefere?</span>
                    </div>
                    <div className="ai-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-card bento-medium bento-erp">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="18" rx="2" />
                    <path d="M2 9h20" />
                    <path d="M10 3v18" />
                  </svg>
                </div>
                <h3 className="bento-title">ERP Financeiro Completo</h3>
                <p className="bento-desc">
                  Controle financeiro que fecha sozinho. Fluxo de caixa, contas a
                  pagar e receber, comissões automáticas e relatórios que você
                  entende de verdade.
                </p>
              </div>
            </div>

            <div className="bento-card bento-medium bento-agenda">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
                <h3 className="bento-title">Agenda Inteligente</h3>
                <p className="bento-desc">
                  Preenchida automaticamente pela IA. Confirmações e lembretes
                  enviados sem você mover um dedo.
                </p>
              </div>
            </div>

            <div className="bento-card bento-small">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12" />
                    <path d="M15.5 9.5a3 3 0 0 0-3-2.5H11a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6h-1.5a3 3 0 0 1-3-2.5" />
                  </svg>
                </div>
                <h3 className="bento-title">Comissões Automáticas</h3>
                <p className="bento-desc">
                  Configure uma vez. Cada profissional recebe o cálculo exato, sem
                  planilhas e sem erros.
                </p>
              </div>
            </div>

            <div className="bento-card bento-small">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                </div>
                <h3 className="bento-title">Controle de Estoque</h3>
                <p className="bento-desc">
                  Saiba exatamente o que tem, o que está acabando e o que precisa
                  comprar.
                </p>
              </div>
            </div>

            <div className="bento-card bento-small">
              <div className="bento-card-inner">
                <div className="bento-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <h3 className="bento-title">Relatórios Visuais</h3>
                <p className="bento-desc">
                  Dashboards elegantes que mostram a saúde do seu negócio em tempo
                  real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="comparison" id="compare">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Comparação</span>
            <h2 className="section-title">
              Por que trocar?
              <br />
              <span className="text-accent">Dá pra ver de relance.</span>
            </h2>
            <p className="section-subtitle">
              Do caderno à planilha, do sistema antigo ao Receps — o que muda
              na rotina do seu negócio.
            </p>
          </div>

          <div className="comparison-wrap reveal">
            <table className="comparison-table" aria-label="Comparativo Receps vs Planilha vs Sistema Antigo">
              <thead>
                <tr>
                  <th scope="col">Recurso</th>
                  <th scope="col">Planilha / Excel</th>
                  <th scope="col">Sistema antigo</th>
                  <th scope="col" className="comparison-highlight">Receps</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td data-state={row.sheet}>{comparisonCell(row.sheet)}</td>
                    <td data-state={row.legacy}>{comparisonCell(row.legacy)}</td>
                    <td data-state={row.receps} className="comparison-highlight">
                      {comparisonCell(row.receps)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Como Funciona</span>
            <h2 className="section-title">
              Três passos para
              <br />
              <span className="text-accent">transformar sua operação.</span>
            </h2>
          </div>

          <div className="steps-grid">
            <div className="step-card reveal">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Configure em minutos</h3>
                <p>
                  Cadastre seus serviços, profissionais e horários. Nossa equipe
                  te acompanha em cada passo da configuração inicial.
                </p>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>A IA começa a trabalhar</h3>
                <p>
                  Conecte ao WhatsApp do seu negócio e a IA já começa a atender,
                  agendar e confirmar. Seus clientes nem percebem que é uma IA.
                </p>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Você só acompanha</h3>
                <p>
                  Enquanto a IA lota sua agenda, o ERP calcula comissões, controla
                  estoque e fecha seu caixa. Você só assiste os resultados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Planos</span>
            <h2 className="section-title">
              Invista no crescimento.
              <br />
              <span className="text-accent">Escolha seu plano.</span>
            </h2>
            <p className="section-subtitle">
              Todos os planos incluem suporte prioritário, atualizações gratuitas
              e onboarding assistido. Teste grátis por 7 dias, sem compromisso.
            </p>
          </div>

          <div className="pricing-grid reveal">
            <div className="pricing-card">
              <div className="pricing-card-inner">
                <div className="pricing-header">
                  <span className="plan-name">Atendente IA</span>
                  <p className="plan-desc">
                    Para quem já tem sistema e quer automatizar o atendimento.
                  </p>
                </div>
                <div className="pricing-amount">
                  <span className="currency">R$</span>
                  <span className="price">149</span>
                  <span className="price-decimal">,99</span>
                  <span className="period">/mês</span>
                </div>
                <span className="trial-badge">7 dias grátis para testar</span>
                <ul className="plan-features">
                  <li>
                    <CheckIcon size={18} />
                    Atendente IA 24h no WhatsApp
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Agendamento automático
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Confirmações e lembretes
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Respostas personalizadas
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Suporte prioritário
                  </li>
                </ul>
                <a href="/cadastro?plan=atendente-ia" className="btn btn-outline btn-block">
                  Começar grátis
                  <span className="btn-icon-wrap">
                    <ArrowRightIcon size={16} />
                  </span>
                </a>
              </div>
            </div>

            <div className="pricing-card pricing-featured">
              <div className="pricing-badge">Mais Popular</div>
              <div className="pricing-card-inner">
                <div className="pricing-header">
                  <span className="plan-name">Atendente + ERP</span>
                  <p className="plan-desc">
                    A solução completa. IA que atende + sistema que gerencia. Tudo
                    no piloto automático.
                  </p>
                </div>
                <div className="pricing-amount">
                  <span className="currency">R$</span>
                  <span className="price">299</span>
                  <span className="price-decimal">,99</span>
                  <span className="period">/mês</span>
                </div>
                <div className="pricing-savings">
                  <span className="savings-strike">R$ 369,98</span>
                  <span className="savings-note">Economize R$ 69,99/mês</span>
                </div>
                <span className="trial-badge trial-badge-featured">7 dias grátis para testar</span>

                <ul className="plan-features">
                  <li>
                    <CheckIcon size={18} />
                    <strong>Tudo do plano Atendente IA</strong>
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    <strong>Tudo do plano ERP</strong>
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Integração IA + Agenda + Financeiro
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Fechamento de caixa automático
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Dashboard unificado em tempo real
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Relatórios avançados de performance
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Onboarding VIP dedicado
                  </li>
                </ul>
                <a
                  href="/cadastro?plan=erp-atendente-ia"
                  className="btn btn-primary btn-block btn-glow"
                >
                  Começar grátis
                  <span className="btn-icon-wrap">
                    <ArrowRightIcon size={16} />
                  </span>
                </a>
              </div>
            </div>

            <div className="pricing-card">
              <div className="pricing-card-inner">
                <div className="pricing-header">
                  <span className="plan-name">ERP</span>
                  <p className="plan-desc">
                    Para quem quer controle financeiro total e gestão
                    profissional.
                  </p>
                </div>
                <div className="pricing-amount">
                  <span className="currency">R$</span>
                  <span className="price">219</span>
                  <span className="price-decimal">,99</span>
                  <span className="period">/mês</span>
                </div>
                <span className="trial-badge">7 dias grátis para testar</span>
                <ul className="plan-features">
                  <li>
                    <CheckIcon size={18} />
                    ERP financeiro completo
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Controle de estoque
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Comissões automáticas
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Fluxo de caixa e DRE
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Agenda integrada
                  </li>
                  <li>
                    <CheckIcon size={18} />
                    Suporte prioritário
                  </li>
                </ul>
                <a href="/cadastro?plan=erp" className="btn btn-outline btn-block">
                  Começar grátis
                  <span className="btn-icon-wrap">
                    <ArrowRightIcon size={16} />
                  </span>
                </a>
              </div>
            </div>
          </div>

          <p className="pricing-trial-note reveal">
            Sem cartão de crédito. Sem compromisso. Cancele a qualquer momento.
          </p>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <RoiCalculator />

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="container container-narrow">
          <div className="section-header reveal">
            <span className="section-tag">Perguntas</span>
            <h2 className="section-title">
              O que todo mundo
              <br />
              <span className="text-accent">pergunta antes.</span>
            </h2>
          </div>

          <div className="faq-list reveal">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={item.q}
                className="faq-item"
                name="faq"
                open={index === 0}
              >
                <summary className="faq-question">
                  <span>{item.q}</span>
                  <svg
                    className="faq-chevron"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
        />
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-card reveal">
            <div className="cta-card-inner">
              <h2 className="cta-title">
                Teste o Receps grátis
                <br />
                por 7 dias.
              </h2>
              <p className="cta-subtitle">
                Crie sua conta em minutos e tenha acesso completo ao sistema. Sem
                cartão de crédito, sem compromisso — cancele quando quiser.
              </p>
              <div className="cta-actions">
                <a href="/erp-atendente-ia" className="btn btn-primary btn-lg btn-white">
                  Começar agora
                  <span className="btn-icon-wrap">
                    <ArrowRightIcon size={18} />
                  </span>
                </a>
              </div>
              <p className="cta-note">
                Acesso imediato ao ERP. Configuração da IA assistida pela nossa
                equipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / SUPPORT */}
      <section className="contact-section" id="contato">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">Suporte</span>
            <h2 className="section-title">
              Fale com a gente.
              <br />
              <span className="text-accent">Do jeito que preferir.</span>
            </h2>
          </div>

          <div className="contact-grid reveal">
            <div className="contact-whatsapp">
              <div className="contact-wa-inner">
                <div className="contact-wa-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                      fill="#25D366"
                    />
                    <path
                      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.266-1.234l-.306-.182-2.87.852.852-2.87-.182-.306A7.96 7.96 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
                      fill="#25D366"
                    />
                  </svg>
                </div>
                <h3 className="contact-wa-title">
                  WhatsApp é o caminho mais rápido
                </h3>
                <p className="contact-wa-desc">
                  Pelo WhatsApp, a conversa flui de forma simples e direta. Nossa
                  equipe responde rápido e resolve suas dúvidas em tempo real —
                  sem formalidades, sem espera.
                </p>
                <a
                  href="https://wa.me/5516991113783"
                  target="_blank"
                  rel="noopener"
                  className="btn btn-whatsapp btn-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.266-1.234l-.306-.182-2.87.852.852-2.87-.182-.306A7.96 7.96 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
                  </svg>
                  Conversar no WhatsApp
                  <span className="btn-icon-wrap">
                    <ArrowRightIcon size={16} />
                  </span>
                </a>
                <span className="contact-wa-hint">
                  Resposta em minutos, não em dias.
                </span>
              </div>
            </div>

            <div className="contact-form-wrap">
              <div className="contact-form-inner">
                <h3 className="contact-form-title">Prefere e-mail?</h3>
                <p className="contact-form-desc">
                  Sem problema. Preencha o formulário e respondemos em até 24
                  horas úteis.
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="nav-logo" aria-label="Receps">
                <Image
                  src="/landing-wordmark.svg"
                  alt="Receps"
                  width={853}
                  height={228}
                  className="nav-logo-img"
                  style={{ height: 24, width: "auto", display: "block" }}
                  unoptimized
                />
              </a>
              <p className="footer-desc">
                Gestão premium para clínicas, consultórios odontológicos,
                barbearias, salões, centros estéticos e estúdios. ERP financeiro
                + Atendente IA no WhatsApp.
              </p>
            </div>
            <div className="footer-links-group">
              <h4>Produto</h4>
              <a href="#features">Funcionalidades</a>
              <a href="#pricing">Planos</a>
              <a href="#how-it-works">Como Funciona</a>
            </div>
            <div className="footer-links-group">
              <h4>Suporte</h4>
              <a href="https://app.receps.com.br/login">Entrar no app</a>
              <a href="#contato">Contato</a>
              <a href="https://wa.me/5516991113783" target="_blank" rel="noopener">
                WhatsApp
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Receps. Todos os direitos reservados.</span>
            <div className="footer-legal">
              <a href="/termos">Termos de Uso</a>
              <a href="/privacidade">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      <Script src="/landing-script.js" strategy="afterInteractive" />
    </div>
  );
}
