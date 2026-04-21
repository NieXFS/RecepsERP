import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiAccent = "primary" | "emerald";

export type KpiCardProps = {
  /** Eyebrow / label pequeno acima do valor. */
  label: string;
  /** Valor principal do KPI (formato já pronto para exibição). */
  value: string;
  /** Subtítulo opcional abaixo do valor. */
  subtitle?: string;
  icon: LucideIcon;
  /** Href opcional — quando fornecido o card vira um Link interativo. */
  href?: string;
  /** Sparkline SVG path ("d" do <path>) opcional. Viewport: 0 0 72 28. */
  sparkPath?: string;
  /** Cor de destaque do ícone, valor e sparkline. Default: primary. */
  accent?: KpiAccent;
  /** Delay de animação de entrada em ms. */
  animationDelay?: number;
};

/**
 * Card de KPI do dashboard — estilo premium com hover lift, ícone colorido e
 * sparkline opcional no canto inferior direito.
 */
export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  href,
  sparkPath,
  accent = "primary",
  animationDelay = 0,
}: KpiCardProps) {
  const iconBg =
    accent === "emerald"
      ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
      : "bg-primary/12 text-primary dark:bg-primary/18";
  const valueColor =
    accent === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-foreground";
  const sparkStroke =
    accent === "emerald" ? "stroke-emerald-500" : "stroke-primary";
  const sparkFill =
    accent === "emerald" ? "fill-emerald-500/28" : "fill-primary/28";

  const cardContent = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] bg-card p-[22px] pb-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]",
        "transition-all duration-[280ms] ease-[cubic-bezier(0.2,0,0,1)]",
        href &&
          "hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_18px_36px_-16px_rgba(139,92,246,0.18)]"
      )}
    >
      <div className="mb-[18px] flex items-center justify-between">
        <div className="text-[12.5px] font-medium text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[11px]",
            iconBg
          )}
        >
          <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
        </div>
      </div>
      <div
        className={cn(
          "text-[30px] font-extrabold leading-none tracking-[-0.04em] tabular-nums",
          valueColor
        )}
      >
        {value}
      </div>
      {subtitle && (
        <div className="mt-[14px] text-[12px] text-muted-foreground">
          {subtitle}
        </div>
      )}
      {sparkPath && (
        <svg
          viewBox="0 0 72 28"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-[18px] right-[18px] h-7 w-[72px] opacity-90"
          aria-hidden="true"
        >
          <path
            d={`${sparkPath} L72,28 L0,28 Z`}
            className={sparkFill}
          />
          <path
            d={sparkPath}
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={sparkStroke}
          />
        </svg>
      )}
    </div>
  );

  const wrapperClass = "block animate-fade-in-up outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:rounded-[22px]";
  const style = animationDelay ? { animationDelay: `${animationDelay}ms` } : undefined;

  if (href) {
    return (
      <Link href={href} className={wrapperClass} style={style}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={wrapperClass} style={style}>
      {cardContent}
    </div>
  );
}
