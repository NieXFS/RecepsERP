import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpArticleCard } from "@/components/help/help-article-card";
import { HelpArticleRenderer } from "@/components/help/help-article-renderer";
import { getHelpArticleBySlug, helpArticles } from "@/lib/help/articles";

export async function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    return {};
  }

  return {
    title: `${article.question} | Ajuda Receps`,
    description: article.answerMarkdown.split("\n\n")[0]?.replace(/\*\*/g, "").slice(0, 160),
    openGraph: {
      title: `${article.question} | Ajuda Receps`,
      description: article.answerMarkdown.split("\n\n")[0]?.replace(/\*\*/g, "").slice(0, 160),
    },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = article.relatedSlugs
    .map((relatedSlug) => getHelpArticleBySlug(relatedSlug))
    .filter((item) => Boolean(item));

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER
    ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(
        "Oi! Não achei minha resposta na central de ajuda do Receps."
      )}`
    : null;

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_20%,#ffffff_100%)]">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="space-y-4">
          <Link href="/ajuda" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Voltar para Ajuda
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Ajuda → {article.category}
          </p>
          <h1 className="text-4xl font-black tracking-[-0.04em]">{article.question}</h1>
          <p className="text-sm text-muted-foreground">
            Atualizado em{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(article.updatedAt))}
          </p>
        </div>

        <article className="mt-10 rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
          <HelpArticleRenderer markdown={article.answerMarkdown} />
        </article>

        {relatedArticles.length > 0 ? (
          <section className="mt-12 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Artigos relacionados</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((relatedArticle) => (
                <HelpArticleCard key={relatedArticle!.slug} article={relatedArticle!} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-[1.75rem] border border-border/70 bg-muted/20 p-6">
          <h2 className="text-xl font-semibold">Não achou o que procurava?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Fale com a gente no WhatsApp e explique o que você está tentando resolver.
          </p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Falar no WhatsApp
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}
