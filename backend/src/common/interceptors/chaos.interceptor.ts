import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { mergeMap, type Observable, timer } from 'rxjs';
import type { EnvironmentVariables } from '../../config/env.validation.js';

const EXEMPT_PATH_PREFIXES = ['/auth', '/health'];

/**
 * Simulates a flaky dependency: random latency on every request and an
 * occasional 503. Failures are raised before the handler runs, so a failed
 * mutation never partially applies and client-side rollback stays truthful.
 */
@Injectable()
export class ChaosInterceptor implements NestInterceptor {
  private readonly enabled: boolean;
  private readonly failureRate: number;
  private readonly maxLatencyMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.enabled = config.get('CHAOS_ENABLED', { infer: true });
    this.failureRate = config.get('CHAOS_FAILURE_RATE', { infer: true });
    this.maxLatencyMs = config.get('CHAOS_MAX_LATENCY_MS', { infer: true });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { path } = context.switchToHttp().getRequest<Request>();
    if (
      !this.enabled ||
      EXEMPT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
    ) {
      return next.handle();
    }

    const latency = Math.floor(this.random() * this.maxLatencyMs);
    const shouldFail = this.random() < this.failureRate;

    return timer(latency).pipe(
      mergeMap(() => {
        if (shouldFail) {
          throw new ServiceUnavailableException(
            'Upstream temporarily unavailable, please retry',
          );
        }
        return next.handle();
      }),
    );
  }

  protected random(): number {
    return Math.random();
  }
}
