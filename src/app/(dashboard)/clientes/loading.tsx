export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
