type ViewTransition = {
  finished: Promise<void>;
};

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

type TransitionOrigin = { clientX: number; clientY: number } | null;

/**
 * Aplica `applyChange` acompanhado de um "circular reveal" originando-se em
 * `event` via View Transitions API. Em navegadores sem suporte ou quando o
 * usuário pediu redução de movimento, aplica a mudança de forma síncrona.
 */
export function startThemeTransition(
  event: TransitionOrigin,
  applyChange: () => void
): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    applyChange();
    return;
  }

  const doc = document as DocumentWithViewTransitions;
  const supportsViewTransitions = typeof doc.startViewTransition === "function";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!supportsViewTransitions || prefersReducedMotion) {
    applyChange();
    return;
  }

  const root = document.documentElement;
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  root.style.setProperty("--theme-reveal-x", `${x}px`);
  root.style.setProperty("--theme-reveal-y", `${y}px`);
  root.style.setProperty("--theme-reveal-radius", `${maxRadius}px`);

  const transition = doc.startViewTransition!(() => {
    applyChange();
  });

  transition.finished.finally(() => {
    root.style.removeProperty("--theme-reveal-x");
    root.style.removeProperty("--theme-reveal-y");
    root.style.removeProperty("--theme-reveal-radius");
  });
}
