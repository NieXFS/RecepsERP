"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ExportEndpoint = "extrato" | "comissoes" | "despesas";

export type ExportButtonProps = {
  endpoint: ExportEndpoint;
  filters: Record<string, string | undefined>;
  suggestedFilename: string;
  label?: string;
  disabled?: boolean;
};

function buildQuery(filters: Record<string, string | undefined>, format: "csv" | "xlsx") {
  const params = new URLSearchParams();
  params.set("format", format);
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "") continue;
    params.set(key, value);
  }
  return params.toString();
}

function extractFilename(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? fallback;
}

export function ExportButton({
  endpoint,
  filters,
  suggestedFilename,
  label = "Exportar",
  disabled,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: "csv" | "xlsx") {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const query = buildQuery(filters, format);
      const response = await fetch(`/api/financeiro/export/${endpoint}?${query}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const filename = extractFilename(
        response.headers.get("Content-Disposition"),
        `${suggestedFilename}.${format}`
      );

      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);

      toast.success("Exportação concluída");
    } catch (error) {
      console.error("[export]", error);
      toast.error("Falha ao exportar");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isExporting}
          >
            {isExporting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            <span>{label}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="text-emerald-600" />
          <span>Exportar como Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="text-muted-foreground" />
          <span>Exportar como CSV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
