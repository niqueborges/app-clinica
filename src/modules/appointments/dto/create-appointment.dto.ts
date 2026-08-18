import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID do médico' })
  @IsUUID('4', { message: 'ID do médico inválido' })
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({ example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', description: 'ID do paciente' })
  @IsUUID('4', { message: 'ID do paciente inválido' })
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({
    example: '2026-08-20T09:00:00.000Z',
    description: 'Data e hora da consulta (ISO 8601)',
  })
  @IsDateString({}, { message: 'Data e hora em formato ISO inválido' })
  @IsNotEmpty()
  dateTime!: string;

  @ApiProperty({ example: 'Primeira consulta de rotina', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
