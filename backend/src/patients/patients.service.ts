import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { isPrismaError, PrismaErrorCode } from '../common/prisma-errors.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePatientDto } from './dto/create-patient.dto.js';
import type { ListPatientsQueryDto } from './dto/list-patients-query.dto.js';
import type { UpdatePatientDto } from './dto/update-patient.dto.js';
import {
  type PaginatedResponse,
  parseDateOnly,
  type PatientResponse,
  toPatientResponse,
} from './entities/patient.entity.js';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListPatientsQueryDto,
  ): Promise<PaginatedResponse<PatientResponse>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const where = buildSearchFilter(search);

    const [patients, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        // id as a tiebreaker keeps pagination stable when sort values repeat.
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data: patients.map(toPatientResponse), page, limit, total };
  }

  async findOne(id: string): Promise<PatientResponse> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return toPatientResponse(patient);
  }

  async create(
    dto: CreatePatientDto,
    actor: AuthUser,
  ): Promise<PatientResponse> {
    try {
      const patient = await this.prisma.patient.create({
        data: { ...toPatientData(dto), createdById: actor.id },
      });
      return toPatientResponse(patient);
    } catch (error) {
      throw mapWriteError(error);
    }
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponse> {
    try {
      const patient = await this.prisma.patient.update({
        where: { id },
        data: toPatientData(dto),
      });
      return toPatientResponse(patient);
    } catch (error) {
      throw mapWriteError(error);
    }
  }

  async remove(id: string): Promise<{ ok: true }> {
    try {
      await this.prisma.patient.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      throw mapWriteError(error);
    }
  }
}

function buildSearchFilter(search?: string): Prisma.PatientWhereInput {
  if (!search) return {};
  const contains = { contains: search, mode: 'insensitive' as const };
  return {
    OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
  };
}

function toPatientData(dto: CreatePatientDto) {
  return {
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    dob: parseDateOnly(dto.dob),
  };
}

function mapWriteError(error: unknown): unknown {
  if (isPrismaError(error, PrismaErrorCode.RecordNotFound)) {
    return new NotFoundException('Patient not found');
  }
  if (isPrismaError(error, PrismaErrorCode.UniqueConstraint)) {
    return new ConflictException('A patient with this email already exists');
  }
  return error;
}
