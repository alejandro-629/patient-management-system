'use client';

import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeletePatient } from '@/hooks/use-patients';
import { fullName } from '@/lib/format';
import type { Patient } from '@/lib/types';

interface DeletePatientDialogProps {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeletePatientDialog({
  patient,
  onOpenChange,
  onDeleted,
}: DeletePatientDialogProps) {
  const remove = useDeletePatient();

  async function confirm() {
    if (!patient) return;
    try {
      await remove.mutateAsync(patient.id);
      toast.success('Patient removed');
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not delete. The list was restored.',
      );
    }
  }

  return (
    <AlertDialog open={patient !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {patient ? fullName(patient) : 'patient'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the record. If the request fails, the
            patient stays on the list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={remove.isPending}
            onClick={confirm}
          >
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
