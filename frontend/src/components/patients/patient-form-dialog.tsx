'use client';

import { toast } from 'sonner';
import { PatientForm } from '@/components/patients/patient-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients';
import type { Patient, PatientInput } from '@/lib/types';
import { emptyPatient, type PatientFormValues } from '@/lib/validation';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
}: PatientFormDialogProps) {
  const create = useCreatePatient();
  const update = useUpdatePatient(patient?.id ?? '');
  const editing = Boolean(patient);
  const pending = create.isPending || update.isPending;

  async function save(input: PatientInput) {
    if (patient) await update.mutateAsync(input);
    else await create.mutateAsync(input);
    toast.success(patient ? 'Patient updated' : 'Patient added');
    onOpenChange(false);
  }

  const defaults: PatientFormValues = patient
    ? {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        dob: patient.dob,
      }
    : emptyPatient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit patient' : 'New patient'}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Update the record for ${patient?.firstName} ${patient?.lastName}.`
              : 'Add a patient to the registry.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PatientForm
            key={patient?.id ?? 'new'}
            defaultValues={defaults}
            submitLabel={editing ? 'Save changes' : 'Add patient'}
            pending={pending}
            onSubmit={save}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
