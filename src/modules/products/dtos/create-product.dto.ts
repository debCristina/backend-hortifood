import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsUUID,
  IsEnum,
  IsUrl,
  MaxLength,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Unit } from '../entities/product.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição detalhada do produto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ description: 'Preço do produto', minimum: 0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Unidade de medida do produto', enum: Unit })
  @IsEnum(Unit)
  @IsNotEmpty()
  unit: Unit;

  @ApiProperty({ description: 'URL da imagem do produto', required: false })
  @IsUrl()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ description: 'Quantidade em estoque', minimum: 0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock_quantity: number;

  @ApiProperty({
    description: 'Porcentagem de desconto',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  discount_percentage?: number;

  @ApiProperty({ description: 'Preço promocional', required: false, minimum: 0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  promotional_price?: number;

  @ApiProperty({ description: 'ID da categoria do produto' })
  @IsUUID()
  @IsNotEmpty()
  category_id: string;
}
