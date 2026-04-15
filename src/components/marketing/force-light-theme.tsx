"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ForceLightTheme() {
  const { theme, setTheme } = useTheme();
  const previousThemeRef = useRef<string | undefined>(theme);

  useEffect(() => {
    if (theme && !previousThemeRef.current) {
      previousThemeRef.current = theme;
    }
  }, [theme]);

  useEffect(() => {
    setTheme("light");
    document.documentElement.style.colorScheme = "light";

    return () => {
      document.documentElement.style.colorScheme = "";

      if (previousThemeRef.current) {
        setTheme(previousThemeRef.current);
      }
    };
  }, [setTheme]);

  return null;
}
