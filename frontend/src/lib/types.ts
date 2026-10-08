export type Role = 'admin' | 'user';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPatients {
  data: Patient[];
  page: number;
  limit: number;
  total: number;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
}

export const SORT_FIELDS = [
  'lastName',
  'firstName',
  'dob',
  'createdAt',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface PatientQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
  requestId?: string;
}
