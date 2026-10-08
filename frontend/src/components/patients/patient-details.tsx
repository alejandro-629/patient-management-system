'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DeletePatientDialog } from '@/components/patients/delete-patient-dialog';
import { PatientFormDialog } from '@/components/patients/patient-form-dialog';
import { PatientDetailsSkeleton } from '@/components/patients/patients-states';
import { Button } from '@/components/ui/button';
import { usePatient } from '@/hooks/use-patients';
import { useSession } from '@/hooks/use-session';
import { formatDate, fullName } from '@/lib/format';

export function PatientDetails({ id }: { id: string }) {
  const router = useRouter();
  const patient = usePatient(id);
  const isAdmin = useSession()?.role === 'admin';
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (patient.isPending) return <PatientDetailsSkeleton />;
  if (patient.isError || !patient.data) {
    return (
      <div role="alert" className="rounded-xl border px-6 py-10 text-center">
        <p className="font-medium">Patient not found</p>
        <Button
          type="button"
          className="mt-4"
          variant="outline"
          onClick={() => router.push('/patients')}
        >
          Back to patients
        </Button>
      </div>
    );
  }

  const record = patient.data;
  const fields = [
    ['Email', record.email],
    ['Phone', record.phoneNumber],
    ['Date of birth', formatDate(record.dob)],
    ['Added', formatDate(record.createdAt.slice(0, 10))],
  ] as const;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/patients"
            className="text-muted-foreground text-sm hover:underline"
          >
            Back to patients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{fullName(record)}</h1>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleting(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      <dl className="shadow-elevated bg-card grid gap-4 rounded-xl border p-6 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </dt>
            <dd className="mt-1">{value}</dd>
          </div>
        ))}
      </dl>
      <PatientFormDialog
        open={editing}
        onOpenChange={setEditing}
        patient={record}
      />
      <DeletePatientDialog
        patient={deleting ? record : null}
        onOpenChange={setDeleting}
        onDeleted={() => router.push('/patients')}
      />
    </article>
  );
}
