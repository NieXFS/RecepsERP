import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnaSectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
  className,
  style,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={cn(
        "group/section relative overflow-hidden rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-sm ring-1 ring-primary/5 transition-all duration-300 hover:ring-primary/25 hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--primary)_35%,transparent)] md:p-6",
        className
      )}
      style={style}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              {icon}
            </span>
          )}
          <div>
            <h2 className="font-heading text-base font-semibold leading-snug text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
