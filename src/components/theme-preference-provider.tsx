"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type ThemePreference = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
};

const STORAGE_KEY = "receps-theme-preference";
const LEGACY_KEY = "theme";

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "auto" || stored === "light" || stored === "dark") {
      return stored;
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy === "light" || legacy === "dark") {
      return legacy;
    }
  } catch {
    /* localStorage indisponível — usa default */
  }
  return "auto";
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredPreference();
    const resolved = resolveTheme(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação segura: estado inicial precisa casar com SSR e só resolvemos via localStorage após o mount
    setPreferenceState(stored);
    setResolvedTheme(resolved);
    setTheme(resolved);
    setMounted(true);
  }, [setTheme]);

  const setPreference = useCallback(
    (value: ThemePreference) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* ignora falha de localStorage */
      }
      const resolved = resolveTheme(value);
      setPreferenceState(value);
      setResolvedTheme(resolved);
      setTheme(resolved);
    },
    [setTheme]
  );

  useEffect(() => {
    if (!mounted) return;
    if (preference !== "auto") return;

    const reevaluate = () => {
      const next = resolveTheme("auto");
      setResolvedTheme((current) => {
        if (current !== next) {
          setTheme(next);
        }
        return next;
      });
    };

    const interval = window.setInterval(reevaluate, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        reevaluate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mounted, preference, setTheme]);

  return (
    <ThemePreferenceContext.Provider
      value={{ preference, setPreference, resolvedTheme, mounted }}
    >
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference precisa estar dentro de ThemePreferenceProvider");
  }
  return context;
}
