import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function PatientsSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Loading patients"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function PatientDetailsSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading patient"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function PatientsEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="font-medium">
        {filtered ? 'No patients match that search' : 'No patients yet'}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {filtered
          ? 'Try a different name or email.'
          : 'Add the first patient to get started.'}
      </p>
    </div>
  );
}

export function PatientsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 rounded-xl border px-6 py-10 text-center"
    >
      <p className="font-medium">Could not load patients</p>
      <p className="text-muted-foreground mt-1 text-sm">
        The request failed. Nothing on screen was changed.
      </p>
      <Button type="button" className="mt-4" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
