import { Download, ExternalLink, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InvoiceStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type InvoiceRow = {
  id: string;
  status: InvoiceStatus;
  amountDue: unknown;
  amountPaid: unknown;
  currency: string;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt?: Date;
};

const STATUS_STYLES: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  PAID: {
    label: "Paga",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  OPEN: {
    label: "Em aberto",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  DRAFT: {
    label: "Rascunho",
    className:
      "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/20",
  },
  VOID: {
    label: "Anulada",
    className:
      "bg-background text-muted-foreground border-border/60",
  },
  UNCOLLECTIBLE: {
    label: "Incobrável",
    className:
      "bg-destructive/10 text-destructive border-destructive/30",
  },
};

function formatCurrency(value: unknown, currency: string) {
  const num = Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number.isFinite(num) ? num : 0);
}

function formatPeriod(start: Date | null, end: Date | null) {
  if (!start && !end) return "—";
  if (start && end) {
    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${format(start, "d", { locale: ptBR })}–${format(end, "d 'de' MMM yyyy", { locale: ptBR })}`;
    }
    return `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(end, "d 'de' MMM yyyy", { locale: ptBR })}`;
  }
  const only = start ?? end;
  return only ? format(only, "d 'de' MMM yyyy", { locale: ptBR }) : "—";
}

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm">
      <header className="flex items-end justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
        <div>
          <h2 className="font-heading text-base font-semibold leading-snug">
            Faturas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico sincronizado do Stripe
          </p>
        </div>
        {invoices.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "fatura" : "faturas"}
          </span>
        )}
      </header>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
          >
            <Receipt className="h-5 w-5" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ainda não há faturas. A primeira aparece após sua primeira cobrança.
          </p>
        </div>
      ) : (
        <TooltipProvider>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Histórico de faturas</caption>
              <thead>
                <tr className="border-y border-border/60 bg-muted/20 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium md:px-6">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">
                    Período
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Valor
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium md:px-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const style = STATUS_STYLES[invoice.status];
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3 md:px-6">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            style.className
                          )}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-foreground/90">
                        {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(
                          invoice.status === "PAID"
                            ? invoice.amountPaid
                            : invoice.amountDue,
                          invoice.currency
                        )}
                      </td>
                      <td className="px-5 py-3 md:px-6">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.hostedInvoiceUrl ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                    href={invoice.hostedInvoiceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Abrir fatura no Stripe"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                }
                              />
                              <TooltipContent>Abrir fatura</TooltipContent>
                            </Tooltip>
                          ) : null}
                          {invoice.pdfUrl ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                    href={invoice.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Baixar PDF da fatura"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                }
                              />
                              <TooltipContent>Baixar PDF</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      )}
    </section>
  );
}
