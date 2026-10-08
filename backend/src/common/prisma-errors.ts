import { Prisma } from '../generated/prisma/client.js';

/** Prisma error codes this API handles explicitly. https://pris.ly/d/prisma-errors */
export const PrismaErrorCode = {
  UniqueConstraint: 'P2002',
  ForeignKeyConstraint: 'P2003',
  RecordNotFound: 'P2025',
} as const;

type PrismaErrorCode = (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode];

export function isPrismaError(
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
