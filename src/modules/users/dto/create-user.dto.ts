import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAddressDto } from '@/modules/addresses/dtos/create-address.dto';
import { Role } from '@/modules/auth/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Telefone do usuário', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Role do usuário',
    enum: Role,
    default: Role.USER,
    required: false
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'Lista de endereços do usuário',
    type: [CreateAddressDto],
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'O usuário deve ter pelo menos um endereço' })
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses: CreateAddressDto[];
}
