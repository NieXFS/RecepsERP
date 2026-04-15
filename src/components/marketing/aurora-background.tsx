import { cn } from "@/lib/utils";

const stars = [
  { top: "12%", left: "10%", delay: "0ms" },
  { top: "18%", left: "24%", delay: "900ms" },
  { top: "14%", left: "76%", delay: "1400ms" },
  { top: "26%", left: "62%", delay: "2200ms" },
  { top: "34%", left: "18%", delay: "600ms" },
  { top: "44%", left: "82%", delay: "2800ms" },
  { top: "58%", left: "12%", delay: "1800ms" },
  { top: "66%", left: "36%", delay: "3200ms" },
  { top: "74%", left: "68%", delay: "1200ms" },
];

type AuroraBackgroundProps = {
  className?: string;
};

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.14),transparent_24%),radial-gradient(circle_at_24%_78%,rgba(56,189,248,0.12),transparent_28%)]" />
      <div className="absolute -left-[10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-violet-500/26 blur-[120px] animate-aurora-pan" />
      <div
        className="absolute right-[-8%] top-[6%] h-[32rem] w-[32rem] rounded-full bg-emerald-400/18 blur-[130px] animate-aurora-pan"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute left-[28%] bottom-[-22%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/10 blur-[150px] animate-aurora-pan"
        style={{ animationDelay: "-11s" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.12)_0%,rgba(10,10,10,0.42)_100%)]" />

      {stars.map((star) => (
        <span
          key={`${star.top}-${star.left}`}
          className="absolute h-1 w-1 rounded-full bg-white/70 animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}
