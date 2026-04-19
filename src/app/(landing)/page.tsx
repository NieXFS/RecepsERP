import Image from "next/image";
import Script from "next/script";

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
            <a href="#features">Funcionalidades</a>
            <a href="#how-it-works">Como Funciona</a>
            <a href="#pricing">Planos</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="nav-actions">
            <a href="https://app.receps.com.br/login" className="nav-login">
              Entrar
            </a>
            <a
              href="https://app.receps.com.br/assinar"
              className="btn btn-primary btn-nav"
            >
              Assinar
              <span className="btn-icon-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
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
            <a
              href="https://app.receps.com.br/assinar"
              className="btn btn-primary btn-mobile-cta"
            >
              Assinar
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
          <a href="#pricing" className="btn btn-primary btn-lg">
            Testar grátis por 7 dias
            <span className="btn-icon-wrap">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </a>
          <a href="#how-it-works" className="btn btn-ghost btn-lg">
            Como funciona
          </a>
        </div>
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Atendente IA 24h no WhatsApp
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Agendamento automático
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirmações e lembretes
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Respostas personalizadas
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Suporte prioritário
                  </li>
                </ul>
                <a
                  href="https://app.receps.com.br/assinar"
                  className="btn btn-outline btn-block"
                >
                  Assinar
                  <span className="btn-icon-wrap">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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

                <ul className="plan-features">
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <strong>Tudo do plano Atendente IA</strong>
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <strong>Tudo do plano ERP</strong>
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Integração IA + Agenda + Financeiro
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Fechamento de caixa automático
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Dashboard unificado em tempo real
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Relatórios avançados de performance
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Onboarding VIP dedicado
                  </li>
                </ul>
                <a
                  href="https://app.receps.com.br/assinar"
                  className="btn btn-primary btn-block btn-glow"
                >
                  Testar grátis por 7 dias
                  <span className="btn-icon-wrap">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    ERP financeiro completo
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Controle de estoque
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Comissões automáticas
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Fluxo de caixa e DRE
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Agenda integrada
                  </li>
                  <li>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Suporte prioritário
                  </li>
                </ul>
                <a
                  href="https://app.receps.com.br/assinar"
                  className="btn btn-outline btn-block"
                >
                  Assinar
                  <span className="btn-icon-wrap">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
                <a
                  href="https://app.receps.com.br/assinar"
                  className="btn btn-primary btn-lg btn-white"
                >
                  Assinar agora
                  <span className="btn-icon-wrap">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
                  href="https://wa.me/5500000000000"
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
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
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
                {/* TODO: wire up form submit */}
                <form
                  className="contact-form"
                  id="contactForm"
                  action="#"
                  method="POST"
                >
                  <div className="form-group">
                    <label htmlFor="contact-name">Nome</label>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email">E-mail</label>
                    <input
                      type="email"
                      id="contact-email"
                      name="email"
                      placeholder="seuemail@exemplo.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-subject">Assunto</label>
                    <textarea
                      id="contact-subject"
                      name="subject"
                      placeholder="Descreva sua dúvida ou mensagem..."
                      rows={4}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    Enviar mensagem
                    <span className="btn-icon-wrap">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </button>
                </form>
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
              <h4>Empresa</h4>
              <a href="#">Sobre</a>
              <a href="#">Blog</a>
              <a href="#">Carreiras</a>
            </div>
            <div className="footer-links-group">
              <h4>Suporte</h4>
              <a href="https://app.receps.com.br/login">Entrar no app</a>
              <a href="#contato">Contato</a>
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener">
                WhatsApp
              </a>
              <a href="#">Status</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Receps. Todos os direitos reservados.</span>
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
