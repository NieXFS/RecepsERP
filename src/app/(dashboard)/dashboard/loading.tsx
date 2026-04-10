export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between px-4">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </div>
            <div className="px-4">
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-center justify-between px-4">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </div>
              <div className="px-4">
                <div className="h-8 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10">
          <div className="px-4">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="px-4">
            <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
