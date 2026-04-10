import type React from "react";

/**
 * Tokens de animação centralizados — Apple HIG + Material Motion.
 * Importar em qualquer componente que precise animar.
 */

// ── Durations (ms) ──────────────────────────────────────────────
export const DURATION = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  chart: 800,
} as const;

// ── Easings (CSS) ───────────────────────────────────────────────
export const EASING = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;

// ── Stagger delay (ms) ──────────────────────────────────────────
export const STAGGER = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;

// ── CSS custom properties (injetar via style) ───────────────────
export function staggerDelay(
  index: number,
  base: number = STAGGER.normal
): React.CSSProperties {
  return { animationDelay: `${index * base}ms` };
}

// ── Reduced motion helper ───────────────────────────────────────
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
