import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { IsPastDateOnly } from '../../common/validators/is-past-date-only.validator.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' .-]*$/u;
const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{5,18}[0-9]$/;

export class CreatePatientDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  @Matches(NAME_PATTERN, {
    message:
      'firstName may only contain letters, spaces, apostrophes, dots and hyphens',
  })
  firstName: string;

  @Transform(trim)
  @IsString()
  @Length(1, 100)
  @Matches(NAME_PATTERN, {
    message:
      'lastName may only contain letters, spaces, apostrophes, dots and hyphens',
  })
  lastName: string;

  @Transform(trimLower)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @Matches(PHONE_PATTERN, {
    message:
      'phoneNumber must be 7-20 characters: digits, spaces, (), - and an optional leading +',
  })
  phoneNumber: string;

  @IsPastDateOnly()
  dob: string;
}
