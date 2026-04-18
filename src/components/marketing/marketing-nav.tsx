"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/atendentes-ia", label: "Atendente IA" },
  { href: "/erp", label: "ERP" },
  { href: "/erp-atendente-ia", label: "ERP + Atendente IA" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 md:flex lg:gap-10">
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Fragment key={item.href}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="h-1 w-1 shrink-0 rounded-full bg-border"
              />
            ) : null}
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "whitespace-nowrap text-sm transition-colors hover:text-foreground",
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
