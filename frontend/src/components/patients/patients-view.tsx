'use client';

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DeletePatientDialog } from '@/components/patients/delete-patient-dialog';
import { PatientFormDialog } from '@/components/patients/patient-form-dialog';
import {
  PatientsEmpty,
  PatientsError,
  PatientsSkeleton,
} from '@/components/patients/patients-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePatients } from '@/hooks/use-patients';
import { useSession } from '@/hooks/use-session';
import { formatDate, fullName } from '@/lib/format';
import {
  SORT_FIELDS,
  type Patient,
  type PatientQuery,
  type SortField,
  type SortOrder,
} from '@/lib/types';

const PAGE_SIZE = 10;

function parseSort(value: string | null): SortField {
  return SORT_FIELDS.includes(value as SortField)
    ? (value as SortField)
    : 'lastName';
}

function parseOrder(value: string | null): SortOrder {
  return value === 'desc' ? 'desc' : 'asc';
}

export function PatientsView() {
  const router = useRouter();
  const params = useSearchParams();
  const isAdmin = useSession()?.role === 'admin';
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const query = useMemo<PatientQuery>(
    () => ({
      page: Math.max(1, Number(params.get('page')) || 1),
      limit: PAGE_SIZE,
      search: params.get('search') ?? '',
      sortBy: parseSort(params.get('sortBy')),
      sortOrder: parseOrder(params.get('sortOrder')),
    }),
    [params],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput.trim() === query.search) return;
      writeQuery(router, params, { search: searchInput.trim(), page: '1' });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, query.search, params, router]);

  const patients = usePatients(query);
  const totalPages = Math.max(
    1,
    Math.ceil((patients.data?.total ?? 0) / PAGE_SIZE),
  );

  function sortBy(field: SortField) {
    const sortOrder: SortOrder =
      query.sortBy === field && query.sortOrder === 'asc' ? 'desc' : 'asc';
    writeQuery(router, params, { sortBy: field, sortOrder, page: '1' });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p
            className={
              isAdmin ? 'text-success text-sm' : 'text-warning text-sm'
            }
          >
            {isAdmin
              ? 'You can add, edit and remove records.'
              : 'You have view-only access.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search patients"
            className="sm:w-64"
          />
          {isAdmin && (
            <Button type="button" onClick={() => setCreating(true)}>
              <PlusIcon />
              New
            </Button>
          )}
        </div>
      </div>

      {patients.isPending && <PatientsSkeleton />}
      {patients.isError && (
        <PatientsError onRetry={() => void patients.refetch()} />
      )}
      {patients.isSuccess && patients.data.data.length === 0 && (
        <PatientsEmpty filtered={query.search.length > 0} />
      )}

      {patients.isSuccess && patients.data.data.length > 0 && (
        <>
          <div className="hidden md:block">
            <PatientTable
              rows={patients.data.data}
              sortByField={query.sortBy}
              sortOrder={query.sortOrder}
              isAdmin={isAdmin}
              onSort={sortBy}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {patients.data.data.map((patient) => (
              <li
                key={patient.id}
                className="shadow-elevated bg-card rounded-xl border p-4"
              >
                <Link
                  href={`/patients/${patient.id}`}
                  className="font-medium hover:underline"
                >
                  {fullName(patient)}
                </Link>
                <p className="text-muted-foreground text-sm">{patient.email}</p>
                <p className="mt-1 text-sm">{formatDate(patient.dob)}</p>
                {isAdmin && (
                  <RowActions
                    patient={patient}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                )}
              </li>
            ))}
          </ul>
          <Pagination
            page={query.page}
            totalPages={totalPages}
            total={patients.data.total}
            onPage={(page) =>
              writeQuery(router, params, { page: String(page) })
            }
          />
        </>
      )}

      <PatientFormDialog open={creating} onOpenChange={setCreating} />
      <PatientFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        patient={editing ?? undefined}
      />
      <DeletePatientDialog
        patient={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </section>
  );
}

function writeQuery(
  router: ReturnType<typeof useRouter>,
  params: ReturnType<typeof useSearchParams>,
  patch: Record<string, string>,
) {
  const next = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  router.replace(`/patients?${next.toString()}`);
}

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'lastName', label: 'Name' },
  { field: 'dob', label: 'Date of birth' },
  { field: 'createdAt', label: 'Added' },
];

function PatientTable({
  rows,
  sortByField,
  sortOrder,
  isAdmin,
  onSort,
  onEdit,
  onDelete,
}: {
  rows: Patient[];
  sortByField: SortField;
  sortOrder: SortOrder;
  isAdmin: boolean;
  onSort: (field: SortField) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return (
    <div className="shadow-elevated bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => {
              const active = sortByField === column.field;
              return (
                <TableHead
                  key={column.field}
                  aria-sort={
                    active
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="hover:text-foreground inline-flex items-center gap-1 font-medium"
                    onClick={() => onSort(column.field)}
                  >
                    {column.label}
                    {active && (
                      <span aria-hidden="true">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </TableHead>
              );
            })}
            <TableHead>Email</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <Link
                  href={`/patients/${patient.id}`}
                  className="font-medium hover:underline"
                >
                  {fullName(patient)}
                </Link>
              </TableCell>
              <TableCell>{formatDate(patient.dob)}</TableCell>
              <TableCell>
                {formatDate(patient.createdAt.slice(0, 10))}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {patient.email}
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <RowActions
                    patient={patient}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RowActions({
  patient,
  onEdit,
  onDelete,
}: {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onEdit(patient)}
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => onDelete(patient)}
      >
        Delete
      </Button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
        <span className="sr-only">, {total} patients</span>
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
