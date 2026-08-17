import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../../generated/prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Lucas Médico' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'lucas.medico@clinica.com.br' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;

  @ApiProperty({ enum: Role, default: Role.PATIENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
