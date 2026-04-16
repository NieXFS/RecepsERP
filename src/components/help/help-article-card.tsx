import Link from "next/link";
import type { HelpArticle } from "@/lib/help/articles";

export function HelpArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link
      href={`/ajuda/${article.slug}`}
      className="block rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {article.category}
      </p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{article.question}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Atualizado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(article.updatedAt))}
      </p>
    </Link>
  );
}
