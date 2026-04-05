import Link from "next/link";

const navigation = [
  { href: "/", label: "Receps" },
  { href: "/atendentes-ia", label: "Atendentes IA" },
  { href: "/erp", label: "ERP" },
];

/**
 * Layout público institucional da Receps.
 * Organiza as páginas comerciais da marca sem acoplar a navegação ao app autenticado.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Receps</p>
              <p className="text-xs text-muted-foreground">Plataforma comercial + operação</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/solicitar-acesso"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Solicitar acesso
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-lg font-semibold">Receps</p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Marca principal da operação. Centralizamos aquisição, implantação e evolução
              dos produtos que atendem clínicas, salões, barbearias e operações de estética.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Produtos</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <Link href="/atendentes-ia" className="hover:text-foreground">
                  Atendentes IA
                </Link>
              </p>
              <p>
                <Link href="/erp" className="hover:text-foreground">
                  ERP Receps
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Acesso</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <Link href="/solicitar-acesso" className="hover:text-foreground">
                  Solicitar acesso ao ERP
                </Link>
              </p>
              <p>
                <Link href="/login" className="hover:text-foreground">
                  Entrar no app
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
