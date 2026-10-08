'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  PaginatedPatients,
  Patient,
  PatientInput,
  PatientQuery,
} from '@/lib/types';

export const patientsKey = (query: PatientQuery) =>
  ['patients', query] as const;

function toSearch(query: PatientQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.search) params.set('search', query.search);
  return params.toString();
}

export function usePatients(query: PatientQuery) {
  return useQuery({
    queryKey: patientsKey(query),
    queryFn: () => api<PaginatedPatients>(`/patients?${toSearch(query)}`),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => api<Patient>(`/patients/${id}`),
  });
}

interface Snapshot {
  snapshots: [readonly unknown[], unknown][];
}

async function prepare(client: QueryClient): Promise<Snapshot> {
  await client.cancelQueries({ queryKey: ['patients'] });
  return { snapshots: client.getQueriesData({ queryKey: ['patients'] }) };
}

function restore(client: QueryClient, context: Snapshot | undefined) {
  context?.snapshots.forEach(([key, data]) => client.setQueryData(key, data));
}

function isList(value: unknown): value is PaginatedPatients {
  return (
    !!value &&
    typeof value === 'object' &&
    'data' in value &&
    Array.isArray(value.data)
  );
}

function patchLists(
  client: QueryClient,
  patch: (list: PaginatedPatients) => PaginatedPatients,
) {
  client.setQueriesData({ queryKey: ['patients'] }, (current: unknown) =>
    isList(current) ? patch(current) : current,
  );
}

export function useCreatePatient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      api<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onMutate: async (input) => {
      const context = await prepare(client);
      const optimistic: Patient = {
        ...input,
        id: `tmp-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      patchLists(client, (list) => ({
        ...list,
        total: list.total + 1,
        data: [optimistic, ...list.data].slice(0, list.limit),
      }));
      return context;
    },
    onError: (_error, _input, context) => restore(client, context),
    onSettled: () => client.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) =>
      api<Patient>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onMutate: async (input) => {
      const context = await prepare(client);
      patchLists(client, (list) => ({
        ...list,
        data: list.data.map((patient) =>
          patient.id === id
            ? { ...patient, ...input, updatedAt: new Date().toISOString() }
            : patient,
        ),
      }));
      client.setQueryData<Patient>(['patients', id], (current) =>
        current
          ? { ...current, ...input, updatedAt: new Date().toISOString() }
          : current,
      );
      return context;
    },
    onError: (_error, _input, context) => restore(client, context),
    onSettled: () => client.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeletePatient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ ok: true }>(`/patients/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      const context = await prepare(client);
      patchLists(client, (list) => ({
        ...list,
        total: Math.max(0, list.total - 1),
        data: list.data.filter((patient) => patient.id !== id),
      }));
      client.removeQueries({ queryKey: ['patients', id] });
      return context;
    },
    onError: (_error, _id, context) => restore(client, context),
    onSettled: () => client.invalidateQueries({ queryKey: ['patients'] }),
  });
}
