import { Suspense } from 'react';
import { PatientsView } from '@/components/patients/patients-view';
import { PatientsSkeleton } from '@/components/patients/patients-states';

export default function PatientsPage() {
  return (
    <Suspense fallback={<PatientsSkeleton />}>
      <PatientsView />
    </Suspense>
  );
}
