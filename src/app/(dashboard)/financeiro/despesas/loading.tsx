export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-[2rem] bg-card px-8 py-7 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-9 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
