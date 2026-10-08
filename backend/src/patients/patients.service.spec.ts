import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePatientDto } from './dto/create-patient.dto.js';
import { PatientsService } from './patients.service.js';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phoneNumber: '+1 555 0100',
  dob: new Date('1990-02-28T00:00:00.000Z'),
  createdById: 'admin-id',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const dto: CreatePatientDto = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phoneNumber: '+1 555 0100',
  dob: '1990-02-28',
};

function mockPrisma() {
  const patient = {
    findMany: vi.fn().mockResolvedValue([row]),
    count: vi.fn().mockResolvedValue(41),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const prisma = {
    patient,
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  return { prisma: prisma as unknown as PrismaService, patient };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('failed', {
    code,
    clientVersion: 'test',
  });
}

describe('PatientsService', () => {
  it('pages with skip/take and a stable id tiebreaker', async () => {
    const { prisma, patient } = mockPrisma();
    const result = await new PatientsService(prisma).list({
      page: 3,
      limit: 10,
      sortBy: 'dob',
      sortOrder: 'desc',
    });

    expect(patient.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ dob: 'desc' }, { id: 'asc' }],
      skip: 20,
      take: 10,
    });
    expect(result).toMatchObject({ page: 3, limit: 10, total: 41 });
    expect(result.data[0]?.dob).toBe('1990-02-28');
  });

  it('searches name and email case-insensitively', async () => {
    const { prisma, patient } = mockPrisma();
    await new PatientsService(prisma).list({
      page: 1,
      limit: 10,
      search: 'ada',
      sortBy: 'lastName',
      sortOrder: 'asc',
    });

    expect(patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { firstName: { contains: 'ada', mode: 'insensitive' } },
            { lastName: { contains: 'ada', mode: 'insensitive' } },
            { email: { contains: 'ada', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('returns 404 when the patient does not exist', async () => {
    const { prisma, patient } = mockPrisma();
    patient.findUnique.mockResolvedValue(null);
    await expect(
      new PatientsService(prisma).findOne(row.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a duplicate email to 409', async () => {
    const { prisma, patient } = mockPrisma();
    patient.create.mockRejectedValue(prismaError('P2002'));
    await expect(
      new PatientsService(prisma).create(dto, {
        id: 'admin-id',
        email: 'admin@demo.com',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a missing row on delete to 404', async () => {
    const { prisma, patient } = mockPrisma();
    patient.delete.mockRejectedValue(prismaError('P2025'));
    await expect(
      new PatientsService(prisma).remove(row.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
