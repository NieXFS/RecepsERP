export default function Loading() {
  return (
    <div className="animate-fade-in rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
