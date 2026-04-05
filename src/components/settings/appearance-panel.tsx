"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TenantAccentTheme } from "@/generated/prisma/enums";
import { updateTenantAccentThemeAction } from "@/actions/tenant-settings.actions";
import {
  getTenantAccentThemeDefinition,
  TENANT_ACCENT_THEMES,
} from "@/lib/tenant-accent-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Monitor, MoonStar, Palette } from "lucide-react";
import { toast } from "sonner";

/**
 * Painel de aparência do tenant.
 * Separa a paleta visual da preferência de dark/light mode já existente.
 */
export function AppearancePanel({
  tenantName,
  currentTheme,
}: {
  tenantName: string;
  currentTheme: TenantAccentTheme;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTheme, setActiveTheme] = useState(currentTheme);
  const [pendingTheme, setPendingTheme] = useState<TenantAccentTheme | null>(
    null
  );

  useEffect(() => {
    setActiveTheme(currentTheme);
  }, [currentTheme]);

  const currentThemeDefinition = getTenantAccentThemeDefinition(activeTheme);

  function handleApplyTheme(theme: TenantAccentTheme) {
    if (theme === activeTheme) {
      return;
    }

    setPendingTheme(theme);

    startTransition(async () => {
      const result = await updateTenantAccentThemeAction(theme);

      if (!result.success) {
        toast.error(result.error);
        setPendingTheme(null);
        return;
      }

      document.documentElement.setAttribute("data-accent-theme", theme);
      setActiveTheme(theme);
      setPendingTheme(null);
      toast.success(
        `Paleta ${getTenantAccentThemeDefinition(theme).label} aplicada com sucesso.`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Palette className="h-3 w-3" />
              Tema atual: {currentThemeDefinition.label}
            </Badge>
            <Badge variant="outline">{tenantName}</Badge>
          </div>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a identidade visual do seu ERP sem alterar o modo de
            aparência. O claro/escuro continua sendo controlado separadamente
            pelo botão no topo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Monitor className="h-4 w-4 text-primary" />
              Appearance mode
            </div>
            <p className="text-sm text-muted-foreground">
              O dark mode atual continua funcionando com qualquer paleta nova.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4 text-primary" />
              Paleta do tenant
            </div>
            <p className="text-sm text-muted-foreground">
              A cor escolhida fica salva no tenant e reaparece em novos logins.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MoonStar className="h-4 w-4 text-primary" />
              Aplicação global
            </div>
            <p className="text-sm text-muted-foreground">
              Sidebar, botões, badges e estados ativos passam a refletir a nova
              paleta em todo o dashboard autenticado.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {TENANT_ACCENT_THEMES.map((theme) => {
          const isCurrent = theme.value === activeTheme;
          const isApplying = pendingTheme === theme.value && isPending;

          return (
            <Card
              key={theme.value}
              className={cn(
                "border transition-all",
                isCurrent && "ring-2 ring-primary/40"
              )}
            >
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {isCurrent && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Ativo
                        </Badge>
                      </div>
                    )}
                    <CardTitle>{theme.label}</CardTitle>
                    <CardDescription>{theme.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border bg-background">
                  <div className="grid grid-cols-[84px_1fr]">
                    <div
                      className="flex min-h-28 flex-col justify-between p-3"
                      style={{ backgroundColor: theme.swatches[3] }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/14 text-xs font-bold text-white">
                        R
                      </div>
                      <div className="space-y-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ backgroundColor: theme.swatches[0] }}
                        />
                        <div className="h-2 rounded-full bg-white/12" />
                        <div className="h-2 rounded-full bg-white/8" />
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-28 rounded-full bg-foreground/10" />
                        <div className="flex gap-2">
                          {theme.swatches.map((swatch) => (
                            <span
                              key={swatch}
                              className="h-4 w-4 rounded-full ring-1 ring-black/10"
                              style={{ backgroundColor: swatch }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border bg-card p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-3 w-24 rounded-full bg-foreground/12" />
                            <div className="h-2.5 w-32 rounded-full bg-foreground/8" />
                          </div>
                          <div
                            className="h-8 w-20 rounded-lg"
                            style={{ backgroundColor: theme.swatches[0] }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <div
                            className="h-8 flex-1 rounded-lg"
                            style={{ backgroundColor: theme.swatches[2] }}
                          />
                          <div className="h-8 w-16 rounded-lg bg-muted" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Compatível com modo claro e escuro.
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleApplyTheme(theme.value)}
                    disabled={isCurrent || isPending}
                  >
                    {isApplying ? "Aplicando..." : isCurrent ? "Tema atual" : "Aplicar tema"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
