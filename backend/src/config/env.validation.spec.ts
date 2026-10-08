import { durationToSeconds, validateEnv } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults and coerces types', () => {
    const env = validateEnv({
      ...validEnv,
      PORT: '4000',
      CHAOS_ENABLED: 'true',
    });
    expect(env.PORT).toBe(4000);
    expect(env.CHAOS_ENABLED).toBe(true);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
  });

  it('treats any value other than "true" as chaos disabled', () => {
    expect(
      validateEnv({ ...validEnv, CHAOS_ENABLED: 'false' }).CHAOS_ENABLED,
    ).toBe(false);
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ JWT_SECRET: validEnv.JWT_SECRET })).toThrow(
      /DATABASE_URL/,
    );
  });
});

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['2m', 120],
    ['1h', 3600],
    ['7d', 604_800],
  ])('converts %s to %d seconds', (input, expected) => {
    expect(durationToSeconds(input)).toBe(expected);
  });

  it('throws on an unsupported format', () => {
    expect(() => durationToSeconds('1 hour')).toThrow();
  });
});
