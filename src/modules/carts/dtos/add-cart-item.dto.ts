import { IsNumber, IsUUID, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  quantity: number;
}
