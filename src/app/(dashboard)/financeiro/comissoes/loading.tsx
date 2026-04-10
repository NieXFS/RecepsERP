export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-88 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
