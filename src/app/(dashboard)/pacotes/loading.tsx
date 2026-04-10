export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
