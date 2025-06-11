import { IsString, IsEmail, IsIn, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@email.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'Senha@123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Tipo de usuário',
    example: 'user',
    enum: ['user', 'hortifruit'],
  })
  @IsString({ message: 'O tipo deve ser uma string' })
  @IsIn(['user', 'hortifruit'], { message: 'Tipo deve ser user ou hortifruit' })
  type: 'user' | 'hortifruit';
}
