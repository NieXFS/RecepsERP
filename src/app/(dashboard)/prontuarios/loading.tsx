export default function Loading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="rounded-[2rem] bg-card px-8 py-7 ring-1 ring-foreground/10">
        <div className="h-7 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
