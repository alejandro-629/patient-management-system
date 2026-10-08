import { z } from 'zod';
import type { PatientInput } from '@/lib/types';

const NAME = /^\p{L}[\p{L}\p{M}' .-]*$/u;
const PHONE = /^\+?[0-9][0-9 ()-]{5,18}[0-9]$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1900;

/** Matches the API rule: a real calendar date, not in the future, not before 1900. Compared in UTC. */
export function isPastDateOnly(value: string, today = new Date()): boolean {
  const match = DATE_ONLY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!real || year < MIN_YEAR) return false;
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return date.getTime() <= todayUtc;
}

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must be at most 100 characters`)
    .regex(
      NAME,
      `${label} may only contain letters, spaces, apostrophes, dots and hyphens`,
    );

export const patientSchema = z.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email must be at most 254 characters')
    .pipe(z.email({ error: 'Enter a valid email address' })),
  phoneNumber: z
    .string()
    .trim()
    .regex(
      PHONE,
      'Use 7-20 characters: digits, spaces, (), - and an optional leading +',
    ),
  dob: z
    .string()
    .refine(isPastDateOnly, 'Enter a valid date between 1900 and today'),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export const emptyPatient: PatientFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dob: '',
};

export function toPatientInput(values: PatientFormValues): PatientInput {
  return patientSchema.parse(values);
}
