"use client";

import { useRef } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useThemePreference,
  type ThemePreference,
} from "@/components/theme-preference-provider";
import { startThemeTransition } from "@/lib/theme-transition";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description?: string;
  icon: typeof Monitor;
}> = [
  {
    value: "auto",
    label: "Automático",
    description: "6h–18h claro, 18h–6h escuro",
    icon: Monitor,
  },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

const LABEL_BY_PREFERENCE: Record<ThemePreference, string> = {
  auto: "Automático",
  light: "Claro",
  dark: "Escuro",
};

/**
 * Dropdown de preferência de tema: Automático / Claro / Escuro.
 * O modo automático resolve por horário local (6h–18h claro, senão escuro).
 */
export function ThemeToggle() {
  const { preference, setPreference, resolvedTheme, mounted } = useThemePreference();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isAuto = mounted && preference === "auto";
  const showDark = mounted && resolvedTheme === "dark";

  function handleSelect(value: ThemePreference) {
    const el = triggerRef.current;
    const origin = el
      ? (() => {
          const rect = el.getBoundingClientRect();
          return {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          };
        })()
      : null;
    startThemeTransition(origin, () => setPreference(value));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            aria-label={
              mounted
                ? `Preferência de tema, atualmente: ${LABEL_BY_PREFERENCE[preference]}`
                : "Preferência de tema"
            }
            suppressHydrationWarning
          >
            <Sun
              className={cn(
                "h-4 w-4 transition-all",
                showDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
              )}
            />
            <Moon
              className={cn(
                "absolute h-4 w-4 transition-all",
                showDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
              )}
            />
            {isAuto ? (
              <span
                aria-hidden="true"
                className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background"
              />
            ) : null}
            <span className="sr-only">Escolher tema</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[14rem]">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = preference === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="pr-2"
            >
              <Icon className="text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </div>
              {isActive ? (
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
