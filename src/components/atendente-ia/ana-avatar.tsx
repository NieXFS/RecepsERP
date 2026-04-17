import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AnaAvatarSize = "sm" | "md" | "lg";

const sizeMap: Record<AnaAvatarSize, { wrapper: string; icon: string; ring: string }> = {
  sm: { wrapper: "h-10 w-10", icon: "h-5 w-5", ring: "inset-[-4px]" },
  md: { wrapper: "h-16 w-16", icon: "h-8 w-8", ring: "inset-[-6px]" },
  lg: { wrapper: "h-24 w-24", icon: "h-11 w-11", ring: "inset-[-8px]" },
};

export function AnaAvatar({
  isActive = false,
  size = "lg",
  className,
}: {
  isActive?: boolean;
  size?: AnaAvatarSize;
  className?: string;
}) {
  const dims = sizeMap[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {isActive && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute rounded-full ring-2 ring-primary/40",
            dims.ring
          )}
          style={{ animation: "pulse-ring 2.4s cubic-bezier(0, 0, 0.2, 1) infinite" }}
        />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,var(--primary),color-mix(in_oklab,var(--primary)_45%,transparent))] text-primary-foreground shadow-lg shadow-primary/25",
          dims.wrapper,
          isActive ? "animate-glow-breathe" : "opacity-70 grayscale-[0.3]"
        )}
      >
        <Sparkles className={dims.icon} aria-hidden="true" />
      </div>
    </div>
  );
}
