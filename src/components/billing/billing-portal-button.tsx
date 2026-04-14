"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BillingPortalButtonProps = {
  returnUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
};

export function BillingPortalButton({
  returnUrl,
  label = "Abrir portal de cobrança",
  variant = "default",
  className,
}: BillingPortalButtonProps) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenPortal() {
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/billing/portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            returnUrl,
          }),
        });

        const data = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Não foi possível abrir o portal.");
        }

        window.location.href = data.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível abrir o portal.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        onClick={handleOpenPortal}
        disabled={isPending}
        className={className}
      >
        {isPending ? "Abrindo..." : label}
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
