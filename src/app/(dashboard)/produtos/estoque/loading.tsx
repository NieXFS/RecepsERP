export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
