import type { Patient } from '../../generated/prisma/client.js';

/** Public API shape. `dob` is a calendar date, so it is serialized as YYYY-MM-DD with no timezone. */
export interface PatientResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export function toPatientResponse(patient: Patient): PatientResponse {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phoneNumber: patient.phoneNumber,
    dob: patient.dob.toISOString().slice(0, 10),
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}

/** Parses a validated YYYY-MM-DD string as UTC midnight, matching Postgres DATE semantics. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
