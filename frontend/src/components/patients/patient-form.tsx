'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import type { PatientInput } from '@/lib/types';
import { patientSchema, type PatientFormValues } from '@/lib/validation';

const FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'dob',
] as const;

/** Maps a 400/409 body onto the matching inputs. Returns false when nothing mapped. */
export function applyServerErrors(
  error: unknown,
  setError: (
    field: (typeof FIELDS)[number],
    error: { message: string },
  ) => void,
): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) {
    const message = Array.isArray(error.body.message)
      ? error.body.message[0]
      : error.body.message;
    setError('email', {
      message: message ?? 'A patient with this email already exists',
    });
    return true;
  }
  if (error.status === 400 && Array.isArray(error.body.message)) {
    let mapped = false;
    for (const message of error.body.message) {
      const field = FIELDS.find((name) => message.startsWith(name));
      if (field) {
        setError(field, { message });
        mapped = true;
      }
    }
    return mapped;
  }
  return false;
}

interface PatientFormProps {
  defaultValues: PatientFormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: PatientInput) => Promise<void>;
  onCancel?: () => void;
}

export function PatientForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  async function handleSubmit(values: PatientFormValues) {
    try {
      await onSubmit(patientSchema.parse(values));
    } catch (error) {
      if (!applyServerErrors(error, form.setError)) {
        form.setError('root', {
          message:
            error instanceof Error
              ? error.message
              : 'Could not save this patient',
        });
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <NameField
          form={form}
          name="firstName"
          label="First name"
          autoComplete="given-name"
        />
        <NameField
          form={form}
          name="lastName"
          label="Last name"
          autoComplete="family-name"
        />
        <NameField
          form={form}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <NameField
          form={form}
          name="phoneNumber"
          label="Phone"
          type="tel"
          autoComplete="tel"
        />
        <Controller
          name="dob"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
              <Input
                {...field}
                id="dob"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
      {form.formState.errors.root && (
        <p role="alert" className="text-destructive text-sm">
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function NameField({
  form,
  name,
  label,
  type = 'text',
  autoComplete,
}: {
  form: ReturnType<typeof useForm<PatientFormValues>>;
  name: 'firstName' | 'lastName' | 'email' | 'phoneNumber';
  label: string;
  type?: string;
  autoComplete: string;
}) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            id={name}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
