import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaErrorCode } from '../prisma-errors.js';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

interface NormalizedError {
  status: number;
  message: string | string[];
}

/** Gives every error the same JSON shape and never leaks internals on 5xx. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const response = http.getResponse<Response>();

    const { status, message } = this.normalize(exception);

    if (status >= 500 && !(exception instanceof HttpException)) {
      this.logger.error(
        { err: exception, path: request.url },
        'Unhandled error while processing request',
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error: reasonPhrase(status),
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(typeof request.id === 'string' ? { requestId: request.id } : {}),
    };

    response.status(status).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && 'message' in res
          ? (res.message as string | string[])
          : exception.message;
      return { status: exception.getStatus(), message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case PrismaErrorCode.UniqueConstraint:
          return {
            status: HttpStatus.CONFLICT,
            message: 'Resource already exists',
          };
        case PrismaErrorCode.RecordNotFound:
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
          };
        case PrismaErrorCode.ForeignKeyConstraint:
          return {
            status: HttpStatus.CONFLICT,
            message: 'Related resource does not exist',
          };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}

function reasonPhrase(status: number): string {
  const name: string | undefined = HttpStatus[status];
  if (!name) return 'Error';
  return name
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
