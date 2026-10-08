import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Whitelisted so clients cannot sort by arbitrary (unindexed) columns. */
export const PATIENT_SORT_FIELDS = [
  'lastName',
  'firstName',
  'dob',
  'createdAt',
] as const;
export type PatientSortField = (typeof PATIENT_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const MAX_PAGE_SIZE = 100;

export class ListPatientsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsIn(PATIENT_SORT_FIELDS)
  sortBy: PatientSortField = 'lastName';

  @IsIn(SORT_ORDERS)
  sortOrder: SortOrder = 'asc';
}
