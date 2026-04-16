"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  helpCategories,
  type HelpArticle,
  type HelpCategory,
} from "@/lib/help/articles";
import { HelpArticleCard } from "@/components/help/help-article-card";
import { HelpCategoryGrid } from "@/components/help/help-category-grid";

type HelpSearchProps = {
  articles: HelpArticle[];
};

function matchesSearch(article: HelpArticle, term: string) {
  if (!term) {
    return true;
  }

  const haystack = [
    article.question,
    article.category,
    article.tags.join(" "),
    article.answerMarkdown,
  ]
    .join(" ")
    .toLowerCase();

  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((chunk) => haystack.includes(chunk));
}

export function HelpSearch({ articles }: HelpSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | "Todas">("Todas");
  const deferredQuery = useDeferredValue(query);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const categoryMatches =
        selectedCategory === "Todas" || article.category === selectedCategory;
      return categoryMatches && matchesSearch(article, deferredQuery);
    });
  }, [articles, deferredQuery, selectedCategory]);

  const grouped = useMemo(() => {
    return helpCategories
      .map((category) => ({
        category,
        articles: filteredArticles.filter((article) => article.category === category),
      }))
      .filter((group) => group.articles.length > 0);
  }, [filteredArticles]);

  return (
    <div className="space-y-10">
      <div className="mx-auto max-w-3xl">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por agendamento, comissões, cartão, setup..."
            className="h-14 w-full rounded-[1.5rem] border border-border/70 bg-background pl-12 pr-4 text-base outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </label>
      </div>

      <HelpCategoryGrid
        categories={helpCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {grouped.length > 0 ? (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.category} id={group.category} className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                  {group.category}
                </p>
                <h2 className="text-2xl font-bold tracking-tight">
                  {group.articles.length} artigo{group.articles.length > 1 ? "s" : ""}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.articles.map((article) => (
                  <HelpArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-border/70 bg-background p-8 text-center shadow-sm">
          <p className="text-lg font-semibold">Nada encontrado por aqui.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tente buscar com outra palavra ou fale com a equipe pelo WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
