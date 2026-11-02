// src/app/loading.tsx
// Скелетон загрузки для сегмента.

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" aria-hidden />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-28 animate-pulse rounded-md bg-muted" aria-hidden />
          ))}
        </div>
      </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6 h-7 w-64 animate-pulse rounded-md bg-muted" aria-hidden />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" aria-hidden />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" aria-hidden />
          <div className="mt-4 h-8 w-full animate-pulse rounded-md bg-muted" aria-hidden />
        </div>
          ))}
        </div>
      </div>
    </div>
  );
}
