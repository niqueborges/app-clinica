import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

class SendReminderDto {
  @ApiProperty({ example: '+5511999998888' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @ApiProperty({ example: '2026-08-20 às 09:00' })
  @IsString()
  @IsNotEmpty()
  dateTime!: string;

  @ApiProperty({ example: 'Dra. Fernanda Silva' })
  @IsString()
  @IsNotEmpty()
  doctorName!: string;
}

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('sms-reminder')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Enfileirar lembrete SMS na fila BullMQ com Redis' })
  @ApiResponse({ status: 202, description: 'Lembrete enfileirado com sucesso' })
  async sendSmsReminder(@Body() dto: SendReminderDto) {
    await this.notificationsService.queueSmsReminder(dto);
    return { message: 'Lembrete SMS enfileirado para processamento assíncrono' };
  }
}
