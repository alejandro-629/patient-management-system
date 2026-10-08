import { registerDecorator, type ValidationOptions } from 'class-validator';

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1900;

/** Calendar date (YYYY-MM-DD) that exists, is not in the future, and is not before 1900. */
export function isPastDateOnly(value: unknown, today = new Date()): boolean {
  if (typeof value !== 'string') return false;
  const match = DATE_ONLY.exec(value);
  if (!match) return false;

  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate || year < MIN_YEAR) return false;

  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return date.getTime() <= todayUtc;
}

export function IsPastDateOnly(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isPastDateOnly',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: `$property must be a valid date (YYYY-MM-DD) between ${MIN_YEAR} and today`,
        ...options,
      },
      validator: { validate: (value: unknown) => isPastDateOnly(value) },
    });
  };
}
