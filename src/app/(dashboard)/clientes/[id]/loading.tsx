export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-52 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-4">
            <div className="h-16 w-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 w-28 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
