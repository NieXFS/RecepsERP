import Link from "next/link";

export type LegalDocumentSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalDocumentProps = {
  title: string;
  description: string;
  updatedAt: string;
  sections: readonly LegalDocumentSection[];
};

export function LegalDocument({
  title,
  description,
  updatedAt,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_16%,#ffffff_100%)] text-[#0A0A0A]">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <nav className="rounded-[1.75rem] border border-border/70 bg-white/90 p-5 shadow-sm backdrop-blur">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Voltar para a Receps
              </Link>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Sumário
                </p>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          </aside>

          <article className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <header className="sticky top-16 z-10 -mx-6 -mt-6 mb-8 border-b border-border/70 bg-white/92 px-6 py-6 backdrop-blur sm:-mx-8 sm:-mt-8 sm:px-8 lg:-mx-10 lg:-mt-10 lg:px-10">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-primary">
                  Documento legal
                </p>
                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                    {description}
                  </p>
                </div>
                <div className="inline-flex rounded-full border border-border bg-muted/35 px-4 py-2 text-sm text-muted-foreground">
                  Última atualização: {updatedAt}
                </div>
              </div>
            </header>

            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
                  <h2 className="text-2xl font-bold tracking-[-0.03em]">{section.title}</h2>
                  <div className="space-y-4 text-[15px] leading-7 text-[#3F3F46] [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:leading-7 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-3 [&_th]:border [&_th]:border-border [&_th]:bg-muted/45 [&_th]:p-3 [&_th]:text-left [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
