"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CountUpStatProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
};

function formatValue(value: number, decimals: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function CountUpStat({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1400,
  className,
}: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || hasStarted) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasStarted, value]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    let frameId = 0;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, hasStarted, value]);

  const formatted = useMemo(
    () => `${prefix}${formatValue(displayValue, decimals)}${suffix}`,
    [decimals, displayValue, prefix, suffix]
  );

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}
