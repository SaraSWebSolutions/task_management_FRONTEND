import { Skeleton } from "./ui";

// Content area placeholder: heading, four stat cards, a big panel and a list
export function PageSkeleton({ header = true, cards = 4 }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      {header && (
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Whole screen (sidebar + top bar + content): shown while a page's code is downloading
export default function AppSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-3 border-r border-slate-200 bg-white p-5">
        <Skeleton className="mb-4 h-12 w-40" />
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </aside>
      <div className="flex-1 min-w-0">
        <div className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </div>
        <main className="p-6">
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}
