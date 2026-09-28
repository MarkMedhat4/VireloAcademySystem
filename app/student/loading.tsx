import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12" role="status" aria-label="جارٍ التحميل">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-64" />
    </div>
  );
}
