import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Criar novo agendamento de consulta' })
  @ApiResponse({ status: 201, description: 'Consulta agendada com sucesso' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get('available-slots')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Consultar horários livres com Cache-Aside no Redis' })
  @ApiQuery({ name: 'doctorId', type: String, required: true })
  @ApiQuery({ name: 'date', type: String, required: true, example: '2026-08-20' })
  getAvailableSlots(@Query('doctorId') doctorId: string, @Query('date') date: string) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Listar agendamentos ativos' })
  @ApiQuery({ name: 'doctorId', type: String, required: false })
  @ApiQuery({ name: 'patientId', type: String, required: false })
  findAll(@Query('doctorId') doctorId?: string, @Query('patientId') patientId?: string) {
    return this.appointmentsService.findAll(doctorId, patientId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT)
  @ApiOperation({ summary: 'Cancelar agendamento (Soft Delete LGPD)' })
  @ApiResponse({ status: 200, description: 'Consulta cancelada com sucesso' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
