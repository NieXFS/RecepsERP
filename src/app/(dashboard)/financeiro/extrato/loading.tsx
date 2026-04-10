export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-88 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="grid gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
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
