import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dra.fernanda@clinica.com.br' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password!: string;
}
