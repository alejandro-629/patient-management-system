import { Suspense } from 'react';
import { PatientDetailsSkeleton } from '@/components/patients/patients-states';
import { PatientDetails } from '@/components/patients/patient-details';

export default function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PatientDetailsSkeleton />}>
      <PatientRoute params={params} />
    </Suspense>
  );
}

async function PatientRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientDetails id={id} />;
}
