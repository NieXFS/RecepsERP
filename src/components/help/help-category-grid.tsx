"use client";

import type { HelpCategory } from "@/lib/help/articles";

type HelpCategoryGridProps = {
  categories: HelpCategory[];
  selectedCategory: HelpCategory | "Todas";
  onSelectCategory: (category: HelpCategory | "Todas") => void;
};

export function HelpCategoryGrid({
  categories,
  selectedCategory,
  onSelectCategory,
}: HelpCategoryGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <button
        type="button"
        onClick={() => onSelectCategory("Todas")}
        className={[
          "rounded-[1.35rem] border px-4 py-4 text-left transition-all",
          selectedCategory === "Todas"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/70 bg-background hover:border-primary/30 hover:shadow-sm",
        ].join(" ")}
      >
        <p className="text-sm font-semibold">Todas</p>
        <p className="mt-1 text-sm text-muted-foreground">Ver toda a base de ajuda.</p>
      </button>

      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelectCategory(category)}
          className={[
            "rounded-[1.35rem] border px-4 py-4 text-left transition-all",
            selectedCategory === category
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border/70 bg-background hover:border-primary/30 hover:shadow-sm",
          ].join(" ")}
        >
          <p className="text-sm font-semibold">{category}</p>
          <p className="mt-1 text-sm text-muted-foreground">Filtrar artigos desta categoria.</p>
        </button>
      ))}
    </div>
  );
}
