import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('Medical Records')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Criar entrada no prontuário eletrônico (Médicos/Admin)' })
  @ApiResponse({ status: 201, description: 'Prontuário criado e auditado com sucesso' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMedicalRecordDto,
    @Req() req: Request
  ) {
    return this.medicalRecordsService.create(user, dto, req.ip);
  }

  @Get('patient/:patientId')
  @Roles(Role.DOCTOR, Role.ADMIN, Role.PATIENT)
  @ApiOperation({
    summary: 'Consultar histórico de prontuários com validação RLS e auditoria LGPD',
  })
  findByPatient(
    @CurrentUser() user: CurrentUserPayload,
    @Param('patientId') patientId: string,
    @Req() req: Request
  ) {
    return this.medicalRecordsService.findByPatient(user, patientId, req.ip);
  }
}
