import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'f6e5d4c3-b2a1-0f9e-8d7c-6b5a4f3e2d1c', description: 'ID do paciente' })
  @IsUUID('4', { message: 'ID do paciente inválido' })
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: 'Hipertensão arterial estágio 1 e histórico familiar de cardiopatia.' })
  @IsString()
  @IsNotEmpty({ message: 'O diagnóstico é obrigatório' })
  diagnosis!: string;

  @ApiProperty({
    example: 'Losartana Potássica 50mg, 1 comprimido ao dia pela manhã.',
    required: false,
  })
  @IsOptional()
  @IsString()
  prescription?: string;

  @ApiProperty({ example: 'Retorno agendado em 60 dias para reavaliação.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
