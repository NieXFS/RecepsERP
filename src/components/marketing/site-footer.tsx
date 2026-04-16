import Link from "next/link";

function getWhatsAppUrl() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER?.trim();

  if (!number) {
    return null;
  }

  return `https://wa.me/${number}`;
}

export function SiteFooter() {
  const whatsappUrl = getWhatsAppUrl();

  return (
    <footer className="border-t border-border/70 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.15fr_0.8fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Receps</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Plataforma de gestão e atendimento para clínicas de estética, consultórios
            odontológicos, barbearias, salões, centros estéticos e studios de beleza.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Navegação</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <Link href="/atendentes-ia" className="hover:text-foreground">
                Atendente IA
              </Link>
            </p>
            <p>
              <Link href="/erp" className="hover:text-foreground">
                ERP Receps
              </Link>
            </p>
            <p>
              <Link href="/ajuda" className="hover:text-foreground">
                Ajuda
              </Link>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Empresa</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <Link href="/termos" className="hover:text-foreground">
                Termos de Uso
              </Link>
            </p>
            <p>
              <Link href="/privacidade" className="hover:text-foreground">
                Política de Privacidade
              </Link>
            </p>
            <p>
              <Link href="/assinar" className="hover:text-foreground">
                Ver planos
              </Link>
            </p>
            <p>
              <Link href="/login" className="hover:text-foreground">
                Entrar no app
              </Link>
            </p>
            {whatsappUrl ? (
              <p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  Contato (WhatsApp)
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
