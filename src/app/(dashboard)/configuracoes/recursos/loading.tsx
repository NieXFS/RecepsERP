export default function Loading() {
  return (
    <div className="animate-fade-in grid gap-8 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((__, innerIndex) => (
              <div key={innerIndex} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
