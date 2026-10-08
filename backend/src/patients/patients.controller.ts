import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { ListPatientsQueryDto } from './dto/list-patients-query.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import type {
  PaginatedResponse,
  PatientResponse,
} from './entities/patient.entity.js';
import { PatientsService } from './patients.service.js';

const uuid = new ParseUUIDPipe({ version: '4' });

@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  list(
    @Query() query: ListPatientsQueryDto,
  ): Promise<PaginatedResponse<PatientResponse>> {
    return this.patients.list(query);
  }

  @Get(':id')
  findOne(@Param('id', uuid) id: string): Promise<PatientResponse> {
    return this.patients.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<PatientResponse> {
    return this.patients.create(dto, actor);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id', uuid) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponse> {
    return this.patients.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', uuid) id: string): Promise<{ ok: true }> {
    return this.patients.remove(id);
  }
}
