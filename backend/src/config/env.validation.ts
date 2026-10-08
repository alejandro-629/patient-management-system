import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must be a postgres connection string',
  })
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @Matches(/^\d+[smhd]$/, {
    message: 'JWT_EXPIRES_IN must look like 30s, 2m, 1h or 7d',
  })
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  // Read the raw value: implicit conversion would turn the string 'false' into true.
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    return raw === true || raw === 'true';
  })
  @IsBoolean()
  CHAOS_ENABLED: boolean = false;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  CHAOS_FAILURE_RATE: number = 0.1;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  CHAOS_MAX_LATENCY_MS: number = 1200;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }
  return env;
}

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

export function durationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
}
