import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { EnvironmentVariables } from '../../config/env.validation.js';

export const REQUEST_ID_HEADER = 'x-request-id';

const LEVEL_BY_ENV: Record<EnvironmentVariables['NODE_ENV'], string> = {
  development: 'debug',
  test: 'silent',
  production: 'info',
};

export function buildLoggerParams(
  nodeEnv: EnvironmentVariables['NODE_ENV'],
): Params {
  return {
    pinoHttp: {
      level: LEVEL_BY_ENV[nodeEnv],
      // Honour an upstream request id (load balancer, frontend) or mint one.
      genReqId: (req: IncomingMessage, res: ServerResponse) => {
        const incoming = req.headers[REQUEST_ID_HEADER];
        const id =
          typeof incoming === 'string' && incoming.length <= 128
            ? incoming
            : randomUUID();
        res.setHeader(REQUEST_ID_HEADER, id);
        return id;
      },
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      customProps: (req) => {
        const user = (req as IncomingMessage & { user?: { id: string } }).user;
        return user ? { userId: user.id } : {};
      },
      autoLogging: { ignore: (req) => req.url === '/health' },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      ...(nodeEnv === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true, translateTime: 'HH:MM:ss.l' },
        },
      }),
    },
  };
}
