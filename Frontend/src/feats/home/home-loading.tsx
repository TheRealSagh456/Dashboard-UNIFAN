import { Skeleton } from "../../components";

export type HomeLoadingVariant = "overview" | "catalog" | "question";

function HeaderSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="w-24" />
      <Skeleton className={compact ? "h-8 w-64" : "h-11 w-80 max-w-full"} />
      <Skeleton className="w-full max-w-xl" />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <HeaderSkeleton />
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} variant="card" className="min-h-32" />
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Skeleton variant="card" className="min-h-[28rem]" />
        <Skeleton variant="card" className="min-h-[28rem]" />
      </section>
    </main>
  );
}

function CatalogSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
        <HeaderSkeleton />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <Skeleton className="mt-10 w-44" />
      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="card" className="min-h-48" />
        ))}
      </section>
    </main>
  );
}

function QuestionSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <Skeleton className="w-48" />
      <div className="mt-6 space-y-6">
        <Skeleton variant="card" className="min-h-48" />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} variant="card" className="min-h-32" />
          ))}
        </section>
        <Skeleton variant="card" className="min-h-[30rem]" />
        <Skeleton variant="card" className="min-h-80" />
      </div>
    </main>
  );
}

export function HomeContentSkeleton({
  variant,
}: {
  variant: HomeLoadingVariant;
}) {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando conteúdo">
      <span className="sr-only">Carregando conteúdo...</span>
      {variant === "overview" && <OverviewSkeleton />}
      {variant === "catalog" && <CatalogSkeleton />}
      {variant === "question" && <QuestionSkeleton />}
    </div>
  );
}
