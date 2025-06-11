import { IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemDto {
  @ApiProperty({
    description: 'ID do produto a ser adicionado ao carrinho',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório' })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'A quantidade é obrigatória' })
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade deve ser maior que zero' })
  quantity: number;
}
