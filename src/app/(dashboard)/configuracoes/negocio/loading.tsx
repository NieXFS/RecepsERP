export default function Loading() {
  return (
    <div className="animate-fade-in rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
