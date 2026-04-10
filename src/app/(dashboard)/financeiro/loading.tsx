export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="rounded-[2rem] bg-card px-8 py-7 ring-1 ring-foreground/10">
        <div className="h-6 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
