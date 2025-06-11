import { IsString, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCartDto {
  @IsUUID()
  hortifruit_id: string;

  @IsUUID()
  delivery_address_id: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  payment_method?: 'credit_card' | 'debit_card' | 'pix' | 'money';

  @IsNumber()
  @IsOptional()
  change_amount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items: CreateCartItemDto[];
}
