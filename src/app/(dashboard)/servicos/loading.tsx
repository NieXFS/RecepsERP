export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-8 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
