import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8" role="status" aria-label="جارٍ التحميل">
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[248px_1fr]">
        <Skeleton className="h-64" />
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}
