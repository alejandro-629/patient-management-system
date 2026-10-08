import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListPatientsQueryDto } from './list-patients-query.dto.js';

async function errorsFor(input: Record<string, unknown>) {
  return validate(plainToInstance(ListPatientsQueryDto, input));
}

describe('ListPatientsQueryDto', () => {
  it('accepts a whitelisted sort', async () => {
    expect(
      await errorsFor({ sortBy: 'dob', sortOrder: 'desc', page: '2' }),
    ).toHaveLength(0);
  });

  it('rejects a sort field outside the whitelist', async () => {
    const errors = await errorsFor({ sortBy: 'passwordHash' });
    expect(errors.map((error) => error.property)).toContain('sortBy');
  });

  it('rejects a page size above 100', async () => {
    const errors = await errorsFor({ limit: '500' });
    expect(errors.map((error) => error.property)).toContain('limit');
  });
});
